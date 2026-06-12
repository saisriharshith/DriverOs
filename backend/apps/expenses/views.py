from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.db.models import Sum
from django.utils import timezone
from .models import Expense
from .serializers import ExpenseSerializer
from trips.models import Trip

class ExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Expense.objects.none()

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Expense.objects.none()
        return Expense.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Automatically link to active trip if not provided
        trip = serializer.validated_data.get('trip')
        if not trip:
            active_trip = Trip.objects.filter(driver=self.request.user, status='ACTIVE').first()
            if active_trip:
                expense = serializer.save(user=self.request.user, trip=active_trip)
            else:
                expense = serializer.save(user=self.request.user)
        else:
            expense = serializer.save(user=self.request.user)
            
        self._recalc_trip_profit(expense)

    def perform_update(self, serializer):
        expense = serializer.save()
        self._recalc_trip_profit(expense)

    def perform_destroy(self, instance):
        trip = instance.trip
        instance.delete()
        if trip:
            self._recalc_trip_profit_for_trip(trip)

    def _recalc_trip_profit(self, expense):
        if expense.trip_id:
            self._recalc_trip_profit_for_trip(expense.trip)

    def _recalc_trip_profit_for_trip(self, trip):
        if trip.status != 'ACTIVE':
            return
        expenses = trip.expenses.all()
        trip.total_fuel_cost = float(expenses.filter(category='FUEL').aggregate(Sum('amount'))['amount__sum'] or 0)
        trip.total_toll_cost = float(expenses.filter(category='TOLL').aggregate(Sum('amount'))['amount__sum'] or 0)
        trip.total_other_expenses = float(
            expenses.exclude(category__in=['FUEL', 'TOLL'])
            .aggregate(Sum('amount'))['amount__sum'] or 0
        )
        total = trip.total_fuel_cost + trip.total_toll_cost + trip.total_other_expenses
        trip.net_profit = float(trip.freight_amount) - total
        trip.save(update_fields=[
            'total_fuel_cost', 'total_toll_cost',
            'total_other_expenses', 'net_profit'
        ])
