from django.utils import timezone
from django.db.models import Sum
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .services.gemini_service import gemini_ocr
from .services.receipt_parser import parse_fuel_receipt_text, extract_structured_data
from expenses.models import Expense
from documents.models import Document
from vehicles.models import Vehicle
from trips.models import Trip


class OCRViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    @action(detail=False, methods=['post'], url_path='process-receipt')
    def process_receipt(self, request):
        """Process fuel receipt image or text"""
        image = request.FILES.get('image')
        text = request.data.get('text', '')
        vehicle_id = request.data.get('vehicle')
        
        # Parse from image using Gemini Vision
        if image:
            ocr_result = gemini_ocr.process_receipt(image)
        else:
            ocr_result = {}
        
        # Parse from text (voice input)
        if text:
            voice_result = parse_fuel_receipt_text(text)
            # Merge results, voice takes precedence for missing fields
            for key, value in voice_result.items():
                if value and not ocr_result.get(key):
                    ocr_result[key] = value
        
        # Auto-link to active trip if vehicle provided
        trip = None
        if vehicle_id:
            try:
                vehicle = Vehicle.objects.get(id=vehicle_id, user=request.user)
                trip = Trip.objects.filter(vehicle=vehicle, status='ACTIVE').first()
            except Vehicle.DoesNotExist:
                pass
        
        return Response({
            'ocr_result': ocr_result,
            'active_trip_id': trip.id if trip else None,
            'can_save': bool(ocr_result.get('amount') or ocr_result.get('litres'))
        })
    
    @action(detail=False, methods=['post'], url_path='process-document')
    def process_document(self, request):
        """Process vehicle document (RC, Insurance, Permit, PUC, Fitness)"""
        image = request.FILES.get('image')
        doc_type = request.data.get('doc_type', 'RC')
        
        if not image:
            return Response({'error': 'Image required'}, status=status.HTTP_400_BAD_REQUEST)
        
        ocr_result = gemini_ocr.process_document(image, doc_type)
        structured = extract_structured_data(ocr_result, doc_type)
        
        return Response({
            'ocr_result': ocr_result,
            'structured_data': structured,
            'doc_type': doc_type,
        })
    
    @action(detail=False, methods=['post'], url_path='save-expense')
    def save_expense(self, request):
        """Save parsed expense from OCR"""
        ocr_data = request.data.get('ocr_data', {})
        vehicle_id = request.data.get('vehicle')
        trip_id = request.data.get('trip')
        
        try:
            vehicle = Vehicle.objects.get(id=vehicle_id, user=request.user)
        except Vehicle.DoesNotExist:
            return Response({'error': 'Vehicle not found'}, status=status.HTTP_404_NOT_FOUND)
        
        trip = None
        if trip_id:
            try:
                trip = Trip.objects.get(id=trip_id, vehicle=vehicle)
            except Trip.DoesNotExist:
                pass
        
        expense = Expense.objects.create(
            vehicle=vehicle,
            trip=trip,
            user=request.user,
            category=ocr_data.get('category', 'FUEL'),
            entry_type='EXPENSE',
            amount=ocr_data.get('amount', 0),
            expense_date=ocr_data.get('date', timezone.now().date()),
            description=ocr_data.get('fuel_station', 'OCR Entry'),
            litres=ocr_data.get('litres'),
            price_per_litre=ocr_data.get('price_per_litre'),
            odometer_reading=ocr_data.get('odometer_reading'),
            fuel_station=ocr_data.get('fuel_station'),
            fuel_type=ocr_data.get('fuel_type'),
            ocr_extracted=ocr_data,
        )
        
        # Auto-update trip totals if linked
        if trip:
            self._update_trip_totals(trip)
        
        return Response({'id': expense.id, 'message': 'Expense saved'})
    
    def _update_trip_totals(self, trip):
        expenses = trip.expenses.all()
        trip.total_fuel_cost = expenses.filter(category='FUEL').aggregate(Sum('amount'))['amount__sum'] or 0
        trip.total_toll_cost = expenses.filter(category='TOLL').aggregate(Sum('amount'))['amount__sum'] or 0
        trip.total_other_expenses = expenses.exclude(category__in=['FUEL', 'TOLL']).aggregate(Sum('amount'))['amount__sum'] or 0
        
        total_expenses = trip.total_fuel_cost + trip.total_toll_cost + trip.total_other_expenses
        trip.net_profit = trip.freight_amount - total_expenses
        
        if trip.start_odometer and trip.end_odometer and trip.total_fuel_cost:
            # Calculate mileage from fuel expenses
            fuel_litres = expenses.filter(category='FUEL', litres__isnull=False).aggregate(Sum('litres'))['litres__sum'] or 0
            if fuel_litres:
                distance = trip.end_odometer - trip.start_odometer
                trip.mileage_achieved = distance / float(fuel_litres)
        
        trip.save()
