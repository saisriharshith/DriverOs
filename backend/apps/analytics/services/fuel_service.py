from django.db.models import Sum, Avg, Count
from django.utils import timezone
from datetime import timedelta
from vehicles.models import Vehicle
from expenses.models import Expense


def get_fuel_analytics(vehicle: Vehicle, period_days=30):
    """Get comprehensive fuel analytics for a vehicle"""
    period_end = timezone.now().date()
    period_start = period_end - timedelta(days=period_days)
    
    fuel_expenses = Expense.objects.filter(
        vehicle=vehicle,
        category='FUEL',
        entry_type='EXPENSE',
        expense_date__gte=period_start,
        expense_date__lte=period_end,
        litres__isnull=False
    ).order_by('expense_date')
    
    if not fuel_expenses.exists():
        return {
            'total_litres': 0,
            'total_cost': 0,
            'avg_price_per_litre': 0,
            'avg_mileage': None,
            'fuel_efficiency_pct': None,
            'fills_count': 0,
            'leakage_detected': False,
            'price_trend': [],
            'mileage_trend': [],
        }
    
    # Aggregates
    total_litres = fuel_expenses.aggregate(Sum('litres'))['litres__sum'] or 0
    total_cost = fuel_expenses.aggregate(Sum('amount'))['amount__sum'] or 0
    avg_price = total_cost / total_litres if total_litres else 0
    fills_count = fuel_expenses.count()
    
    # Calculate mileage from odometer readings
    mileage_data = []
    prev = None
    for exp in fuel_expenses:
        if exp.odometer_reading and exp.litres:
            if prev and exp.odometer_reading > prev['odometer']:
                km = exp.odometer_reading - prev['odometer']
                mileage = km / float(prev['litres'])
                mileage_data.append({
                    'date': exp.expense_date,
                    'mileage': round(mileage, 2),
                    'odometer': exp.odometer_reading,
                })
            prev = {'odometer': exp.odometer_reading, 'litres': exp.litres}
    
    avg_mileage = sum(m['mileage'] for m in mileage_data) / len(mileage_data) if mileage_data else None
    
    # Fuel efficiency vs expected
    fuel_efficiency_pct = None
    if avg_mileage and vehicle.expected_mileage:
        fuel_efficiency_pct = round((avg_mileage / float(vehicle.expected_mileage)) * 100, 2)
    
    # Leakage detection: if mileage drops significantly
    leakage_detected = False
    if len(mileage_data) >= 3:
        recent_avg = sum(m['mileage'] for m in mileage_data[-3:]) / 3
        older_avg = sum(m['mileage'] for m in mileage_data[:-3]) / max(1, len(mileage_data) - 3)
        if recent_avg < older_avg * 0.85:  # 15% drop
            leakage_detected = True
    
    # Price trend (last 10 fills)
    price_trend = list(fuel_expenses.order_by('-expense_date')[:10].values(
        'expense_date', 'price_per_litre', 'litres', 'amount'
    ))
    
    # Mileage trend
    mileage_trend = mileage_data[-10:] if mileage_data else []
    
    return {
        'total_litres': round(total_litres, 2),
        'total_cost': round(total_cost, 2),
        'avg_price_per_litre': round(avg_price, 2),
        'avg_mileage': round(avg_mileage, 2) if avg_mileage else None,
        'fuel_efficiency_pct': fuel_efficiency_pct,
        'fills_count': fills_count,
        'leakage_detected': leakage_detected,
        'price_trend': list(reversed(price_trend)),
        'mileage_trend': mileage_trend,
    }


def get_fuel_comparison(user, period_days=30):
    """Compare fuel efficiency across all user's vehicles"""
    vehicles = Vehicle.objects.filter(user=user, is_active=True)
    comparison = []
    
    for vehicle in vehicles:
        analytics = get_fuel_analytics(vehicle, period_days)
        comparison.append({
            'vehicle_id': vehicle.id,
            'vehicle_number': vehicle.vehicle_number,
            'vehicle_type': vehicle.vehicle_type,
            'expected_mileage': float(vehicle.expected_mileage) if vehicle.expected_mileage else None,
            'actual_mileage': analytics['avg_mileage'],
            'efficiency_pct': analytics['fuel_efficiency_pct'],
            'total_cost': analytics['total_cost'],
            'leakage_detected': analytics['leakage_detected'],
        })
    
    return sorted(comparison, key=lambda x: x['efficiency_pct'] or 0, reverse=True)
