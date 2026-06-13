from django.db import models
from django.conf import settings
from django.utils import timezone
from vehicles.models import Vehicle

class Trip(models.Model):
    STATUS = [
        ('ACTIVE', 'Active'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]
    LOAD_TYPES = [
        ('FULL', 'Full Truck Load'),
        ('PART', 'Part Load'),
        ('RETURN', 'Return Empty'),
    ]
    
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='trips')
    driver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='driven_trips')
    
    start_location = models.CharField(max_length=200)
    end_location = models.CharField(max_length=200, blank=True, default='')
    start_lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    start_lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    end_lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    end_lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    distance_km = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    
    load_type = models.CharField(max_length=10, choices=LOAD_TYPES, default='FULL')
    freight_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    advance_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    balance_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    status = models.CharField(max_length=10, choices=STATUS, default='ACTIVE')
    start_time = models.DateTimeField(default=timezone.now)
    end_time = models.DateTimeField(null=True, blank=True)
    
    start_odometer = models.IntegerField(default=0)
    end_odometer = models.IntegerField(null=True, blank=True)
    
    total_fuel_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_toll_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_other_expenses = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    net_profit = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    mileage_achieved = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    def save(self, *args, **kwargs):
        if self.freight_amount is not None and self.advance_amount is not None:
            self.balance_amount = self.freight_amount - self.advance_amount
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Trip {self.id}: {self.start_location} -> {self.end_location}"
