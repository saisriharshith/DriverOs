from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum
from drf_spectacular.utils import extend_schema
from expenses.models import Expense
from trips.models import Trip
from compliance.models import ComplianceScore
from documents.models import Document
from vehicles.models import Vehicle
from .services.pnl_service import get_fleet_summary
from compliance.services.compliance_service import calculate_user_compliance


class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        responses={
            200: {
                "type": "object",
                "properties": {
                    "total_expenses": {"type": "number"},
                    "total_income": {"type": "number"},
                    "total_trips": {"type": "integer"},
                    "active_trips": {"type": "integer"},
                    "compliance_score": {"type": "integer"},
                    "risk_level": {"type": "string"},
                    "total_documents": {"type": "integer"},
                    "expired_documents": {"type": "integer"},
                    "total_vehicles": {"type": "integer"},
                }
            }
        }
    )
    def get(self, request):
        user = request.user
        
        # Trigger compliance update
        calculate_user_compliance(user)
        
        # Financial summary
        total_expenses = Expense.objects.filter(user=user, entry_type='EXPENSE').aggregate(Sum('amount'))['amount__sum'] or 0
        total_income = Expense.objects.filter(user=user, entry_type='INCOME').aggregate(Sum('amount'))['amount__sum'] or 0
        
        # Trips summary
        total_trips = Trip.objects.filter(driver=user).count()
        active_trips = Trip.objects.filter(driver=user, status='ACTIVE').count()
        
        # Compliance summary
        compliance = ComplianceScore.objects.filter(user=user).first()
        score = compliance.score if compliance else 100
        risk = compliance.risk_level if compliance else 'SAFE'
        
        # Documents summary
        total_docs = Document.objects.filter(user=user).count()
        expired_docs = Document.objects.filter(user=user, status='EXPIRED').count()
        
        # Vehicles summary
        total_vehicles = Vehicle.objects.filter(user=user).count()

        return Response({
            "total_expenses": total_expenses,
            "total_income": total_income,
            "total_trips": total_trips,
            "active_trips": active_trips,
            "compliance_score": score,
            "risk_level": risk,
            "total_documents": total_docs,
            "expired_documents": expired_docs,
            "total_vehicles": total_vehicles,
        })


class FleetSummaryView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        period_days = int(request.query_params.get('days', 30))
        summary = get_fleet_summary(request.user, period_days)
        return Response(summary)


class VehiclePnLView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, vehicle_pk):
        from .services.pnl_service import compute_vehicle_pnl
        from vehicles.models import Vehicle
        from django.utils import timezone
        from datetime import timedelta
        
        try:
            vehicle = Vehicle.objects.get(id=vehicle_pk, user=request.user)
        except Vehicle.DoesNotExist:
            return Response({'detail': 'Vehicle not found'}, status=404)
        
        period_days = int(request.query_params.get('days', 30))
        period_end = timezone.now().date()
        period_start = period_end - timedelta(days=period_days)
        
        from .services.pnl_service import compute_vehicle_pnl
        pnl = compute_vehicle_pnl(vehicle, period_start, period_end)
        
        return Response({
            'vehicle': vehicle.id,
            'period_start': period_start,
            'period_end': period_end,
            'total_freight': float(pnl.total_freight),
            'total_expenses': float(pnl.total_expenses),
            'net_profit': float(pnl.net_profit),
            'profit_margin_pct': float(pnl.profit_margin_pct),
            'total_km': float(pnl.total_km),
            'total_trips': pnl.total_trips,
            'avg_mileage': float(pnl.avg_mileage) if pnl.avg_mileage else None,
            'fuel_efficiency_pct': float(pnl.fuel_efficiency_pct) if pnl.fuel_efficiency_pct else None,
            'fuel_cost': float(pnl.fuel_cost),
            'toll_cost': float(pnl.toll_cost),
            'repair_cost': float(pnl.repair_cost),
            'tyre_cost': float(pnl.tyre_cost),
            'maintenance_cost': float(pnl.maintenance_cost),
            'other_cost': float(pnl.other_cost),
        })


class FuelAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, vehicle_pk):
        from .services.fuel_service import get_fuel_analytics
        from vehicles.models import Vehicle
        
        try:
            vehicle = Vehicle.objects.get(id=vehicle_pk, user=request.user)
        except Vehicle.DoesNotExist:
            return Response({'detail': 'Vehicle not found'}, status=404)
        
        period_days = int(request.query_params.get('days', 30))
        analytics = get_fuel_analytics(vehicle, period_days)
        return Response(analytics)
