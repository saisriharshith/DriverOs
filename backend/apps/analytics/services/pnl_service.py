from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta
from vehicles.models import Vehicle
from trips.models import Trip
from expenses.models import Expense
from ..models import VehiclePnL


def compute_vehicle_pnl(vehicle: Vehicle, period_start, period_end) -> VehiclePnL:
    """Compute P&L for a vehicle for a given period"""
    
    # Get trips in period
    trips = Trip.objects.filter(
        vehicle=vehicle,
        start_time__date__gte=period_start,
        start_time__date__lte=period_end,
        status='COMPLETED'
    )
    
    # Income
    total_freight = trips.aggregate(Sum('freight_amount'))['freight_amount__sum'] or 0
    total_advances = trips.aggregate(Sum('advance_amount'))['advance_amount__sum'] or 0
    
    # Expenses in period
    expenses = Expense.objects.filter(
        vehicle=vehicle,
        expense_date__gte=period_start,
        expense_date__lte=period_end,
        entry_type='EXPENSE'
    )
    
    # Category-wise expenses
    fuel_cost = expenses.filter(category='FUEL').aggregate(Sum('amount'))['amount__sum'] or 0
    toll_cost = expenses.filter(category='TOLL').aggregate(Sum('amount'))['amount__sum'] or 0
    repair_cost = expenses.filter(category='REPAIR').aggregate(Sum('amount'))['amount__sum'] or 0
    tyre_cost = expenses.filter(category='TYRE').aggregate(Sum('amount'))['amount__sum'] or 0
    maintenance_cost = expenses.filter(category='SERVICE').aggregate(Sum('amount'))['amount__sum'] or 0
    
    # Other expenses (everything else)
    other_categories = ['LOADING', 'PARKING', 'FOOD', 'FINES', 'INSURANCE', 'OIL', 'OTHER']
    other_cost = expenses.filter(category__in=other_categories).aggregate(Sum('amount'))['amount__sum'] or 0
    
    total_expenses = fuel_cost + toll_cost + repair_cost + tyre_cost + maintenance_cost + other_cost
    net_profit = total_freight - total_expenses
    profit_margin_pct = (net_profit / total_freight * 100) if total_freight else 0
    
    # Operational metrics
    total_km = trips.aggregate(Sum('distance_km'))['distance_km__sum'] or 0
    total_trips = trips.count()
    
    # Average mileage from fuel expenses
    fuel_expenses = expenses.filter(category='FUEL', litres__isnull=False)
    total_litres = fuel_expenses.aggregate(Sum('litres'))['litres__sum'] or 0
    avg_mileage = (total_km / total_litres) if total_litres else None
    
    # Fuel efficiency vs expected
    fuel_efficiency_pct = None
    if avg_mileage and vehicle.expected_mileage:
        fuel_efficiency_pct = (avg_mileage / vehicle.expected_mileage) * 100
    
    # Update or create PnL record
    pnl, created = VehiclePnL.objects.update_or_create(
        vehicle=vehicle,
        period_start=period_start,
        period_end=period_end,
        defaults={
            'total_freight': total_freight,
            'total_advances': total_advances,
            'fuel_cost': fuel_cost,
            'toll_cost': toll_cost,
            'repair_cost': repair_cost,
            'tyre_cost': tyre_cost,
            'maintenance_cost': maintenance_cost,
            'other_cost': other_cost,
            'total_expenses': total_expenses,
            'net_profit': net_profit,
            'profit_margin_pct': round(profit_margin_pct, 2),
            'total_km': total_km,
            'total_trips': total_trips,
            'avg_mileage': round(avg_mileage, 2) if avg_mileage else None,
            'fuel_efficiency_pct': round(fuel_efficiency_pct, 2) if fuel_efficiency_pct else None,
        }
    )
    
    return pnl


def compute_all_vehicles_pnl(period_days=30):
    """Compute P&L for all active vehicles"""
    period_end = timezone.now().date()
    period_start = period_end - timedelta(days=period_days)
    
    vehicles = Vehicle.objects.filter(is_active=True)
    results = []
    for vehicle in vehicles:
        pnl = compute_vehicle_pnl(vehicle, period_start, period_end)
        results.append(pnl)
    return results


def get_fleet_summary(user, period_days=30):
    """Get fleet-wide summary for multi-vehicle owners"""
    period_end = timezone.now().date()
    period_start = period_end - timedelta(days=period_days)
    
    vehicles = Vehicle.objects.filter(user=user, is_active=True)
    
    total_freight = 0
    total_expenses = 0
    total_profit = 0
    total_km = 0
    total_trips = 0
    vehicle_count = vehicles.count()
    
    for vehicle in vehicles:
        pnl = compute_vehicle_pnl(vehicle, period_start, period_end)
        total_freight += float(pnl.total_freight)
        total_expenses += float(pnl.total_expenses)
        total_profit += float(pnl.net_profit)
        total_km += float(pnl.total_km)
        total_trips += pnl.total_trips
    
    return {
        'vehicle_count': vehicle_count,
        'total_freight': total_freight,
        'total_expenses': total_expenses,
        'total_profit': total_profit,
        'profit_margin': (total_profit / total_freight * 100) if total_freight else 0,
        'total_km': total_km,
        'total_trips': total_trips,
        'period_start': period_start,
        'period_end': period_end,
    }
