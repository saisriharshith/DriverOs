from django.db import models
from django.conf import settings
from vehicles.models import Vehicle

class VehiclePnL(models.Model):
    """Pre-computed per-vehicle P&L for dashboard performance"""
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='pnl_records')
    period_start = models.DateField()
    period_end = models.DateField()
    
    # Income
    total_freight = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_advances = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Expenses by category
    fuel_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    toll_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    repair_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tyre_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    maintenance_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    other_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Totals
    total_expenses = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_profit = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    profit_margin_pct = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Operational
    total_km = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_trips = models.IntegerField(default=0)
    avg_mileage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    fuel_efficiency_pct = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    computed_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['vehicle', 'period_start', 'period_end']),
        ]
    
    def __str__(self):
        return f"{self.vehicle.vehicle_number} P&L ({self.period_start} to {self.period_end})"
