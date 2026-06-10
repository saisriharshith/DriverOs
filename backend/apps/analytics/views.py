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
        
        # Financial summary
        total_expenses = Expense.objects.filter(user=user, entry_type='EXPENSE').aggregate(Sum('amount'))['amount__sum'] or 0
        total_income = Expense.objects.filter(user=user, entry_type='INCOME').aggregate(Sum('amount'))['amount__sum'] or 0
        
        # Trips summary
        total_trips = Trip.objects.filter(user=user).count()
        active_trips = Trip.objects.filter(user=user, status='ACTIVE').count()
        
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
