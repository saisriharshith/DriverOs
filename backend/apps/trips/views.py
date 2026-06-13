from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum
from django.utils import timezone
from decimal import Decimal
from .models import Trip
from .serializers import TripSerializer
from vehicles.models import Vehicle
from expenses.models import Expense


class TripViewSet(viewsets.ModelViewSet):
    serializer_class = TripSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Trip.objects.none()
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['start_time', 'status']
    ordering = ['-start_time']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Trip.objects.none()
        return Trip.objects.filter(driver=self.request.user)

    def perform_create(self, serializer):
        vehicle_id = serializer.validated_data.get('vehicle')
        if vehicle_id:
            vehicle = Vehicle.objects.get(id=vehicle_id.id)
            trip = serializer.save(driver=self.request.user, start_odometer=vehicle.current_odometer)
        else:
            trip = serializer.save(driver=self.request.user)

        # Auto-add freight and advance to finance tracker
        self._create_trip_finance_entries(trip, self.request.user)

    @action(detail=False, methods=['get'], url_path='active')
    def active_trip(self, request):
        trip = Trip.objects.filter(driver=request.user, status='ACTIVE').first()
        if trip:
            serializer = self.get_serializer(trip)
            return Response(serializer.data)
        return Response({'detail': 'No active trip'}, status=404)

    @action(detail=True, methods=['post'], url_path='complete')
    def complete_trip(self, request, pk=None):
        trip = self.get_object()
        if trip.status != 'ACTIVE':
            return Response({'detail': 'Trip is not active'}, status=400)
        
        end_odometer = request.data.get('end_odometer')
        end_location = request.data.get('end_location')
        end_lat = request.data.get('end_lat')
        end_lng = request.data.get('end_lng')
        
        if end_odometer:
            trip.end_odometer = end_odometer
        if end_location:
            trip.end_location = end_location
        if end_lat:
            trip.end_lat = end_lat
        if end_lng:
            trip.end_lng = end_lng
        
        trip.end_time = timezone.now()
        trip.status = 'COMPLETED'
        
        # Calculate distance
        if trip.start_odometer and trip.end_odometer:
            trip.distance_km = trip.end_odometer - trip.start_odometer
        
        # Calculate expenses
        expenses = trip.expenses.all()
        trip.total_fuel_cost = expenses.filter(category='FUEL').aggregate(Sum('amount'))['amount__sum'] or 0
        trip.total_toll_cost = expenses.filter(category='TOLL').aggregate(Sum('amount'))['amount__sum'] or 0
        trip.total_other_expenses = expenses.exclude(category__in=['FUEL', 'TOLL']).aggregate(Sum('amount'))['amount__sum'] or 0
        
        total_expenses = trip.total_fuel_cost + trip.total_toll_cost + trip.total_other_expenses
        trip.net_profit = trip.freight_amount - total_expenses
        
        # Calculate mileage
        fuel_litres = expenses.filter(category='FUEL', litres__isnull=False).aggregate(Sum('litres'))['litres__sum'] or 0
        if fuel_litres and trip.distance_km:
            trip.mileage_achieved = trip.distance_km / float(fuel_litres)
        
        trip.save()
        
        # Update vehicle odometer
        if trip.end_odometer:
            vehicle = trip.vehicle
            vehicle.current_odometer = trip.end_odometer
            vehicle.save(update_fields=['current_odometer'])
        
        serializer = self.get_serializer(trip)
        return Response(serializer.data)

    @staticmethod
    def _create_trip_finance_entries(trip, user):
        """Auto-create finance entries when a trip starts.
        - Freight amount → INCOME / FREIGHT
        - Advance amount → INCOME / FREIGHT (noted as advance)
        """
        today = trip.start_time.date() if trip.start_time else timezone.now().date()
        trip_label = f"{trip.start_location} → {trip.end_location}"

        # Freight (total cost) as income
        if trip.freight_amount and Decimal(str(trip.freight_amount)) > 0:
            Expense.objects.create(
                user=user,
                vehicle=trip.vehicle,
                trip=trip,
                category='FREIGHT',
                entry_type='INCOME',
                amount=trip.freight_amount,
                expense_date=today,
                description=f"Freight for trip: {trip_label}",
            )

        # Advance as income
        if trip.advance_amount and Decimal(str(trip.advance_amount)) > 0:
            Expense.objects.create(
                user=user,
                vehicle=trip.vehicle,
                trip=trip,
                category='FREIGHT',
                entry_type='INCOME',
                amount=trip.advance_amount,
                expense_date=today,
                description=f"Advance for trip: {trip_label}",
            )


class VehicleTripViewSet(viewsets.ModelViewSet):
    """Vehicle-scoped trips"""
    serializer_class = TripSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Trip.objects.none()
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['start_time', 'status']
    ordering = ['-start_time']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Trip.objects.none()
        vehicle_id = self.kwargs.get('vehicle_pk')
        return Trip.objects.filter(vehicle_id=vehicle_id, vehicle__user=self.request.user)

    def perform_create(self, serializer):
        vehicle_id = self.kwargs.get('vehicle_pk')
        vehicle = Vehicle.objects.get(id=vehicle_id, user=self.request.user)
        trip = serializer.save(vehicle=vehicle, driver=self.request.user, start_odometer=vehicle.current_odometer)

        # Auto-add freight and advance to finance tracker
        TripViewSet._create_trip_finance_entries(trip, self.request.user)

    @action(detail=True, methods=['post'], url_path='complete')
    def complete_trip(self, request, pk=None, vehicle_pk=None):
        trip = self.get_object()
        if trip.status != 'ACTIVE':
            return Response({'detail': 'Trip is not active'}, status=400)
        
        end_odometer = request.data.get('end_odometer')
        end_location = request.data.get('end_location')
        end_lat = request.data.get('end_lat')
        end_lng = request.data.get('end_lng')
        
        if end_odometer:
            trip.end_odometer = end_odometer
        if end_location:
            trip.end_location = end_location
        if end_lat:
            trip.end_lat = end_lat
        if end_lng:
            trip.end_lng = end_lng
        
        trip.end_time = timezone.now()
        trip.status = 'COMPLETED'
        
        # Calculate distance
        if trip.start_odometer and trip.end_odometer:
            trip.distance_km = trip.end_odometer - trip.start_odometer
        
        # Calculate expenses
        expenses = trip.expenses.all()
        trip.total_fuel_cost = expenses.filter(category='FUEL').aggregate(Sum('amount'))['amount__sum'] or 0
        trip.total_toll_cost = expenses.filter(category='TOLL').aggregate(Sum('amount'))['amount__sum'] or 0
        trip.total_other_expenses = expenses.exclude(category__in=['FUEL', 'TOLL']).aggregate(Sum('amount'))['amount__sum'] or 0
        
        total_expenses = trip.total_fuel_cost + trip.total_toll_cost + trip.total_other_expenses
        trip.net_profit = trip.freight_amount - total_expenses
        
        # Calculate mileage
        fuel_litres = expenses.filter(category='FUEL', litres__isnull=False).aggregate(Sum('litres'))['litres__sum'] or 0
        if fuel_litres and trip.distance_km:
            trip.mileage_achieved = trip.distance_km / float(fuel_litres)
        
        trip.save()
        
        # Update vehicle odometer
        if trip.end_odometer:
            vehicle = trip.vehicle
            vehicle.current_odometer = trip.end_odometer
            vehicle.save(update_fields=['current_odometer'])
        
        serializer = self.get_serializer(trip)
        return Response(serializer.data)
