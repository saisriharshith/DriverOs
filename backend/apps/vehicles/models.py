from django.db import models
from django.conf import settings

from core_validators import validate_vehicle_number

class Vehicle(models.Model):
    VEHICLE_TYPES = [
        ('TRUCK', 'Truck (10-16T)'),
        ('HEAVY_TRUCK', 'Heavy Truck (16-25T)'),
        ('TRAILER', 'Trailer (25T+)'),
        ('LCV', 'LCV (3.5-7.5T)'),
        ('TAXI', 'Taxi/Car'),
        ('AUTO', 'Auto Rickshaw'),
    ]
    
    ENGINE_TYPES = [
        ('DIESEL', 'Diesel'),
        ('CNG', 'CNG'),
        ('PETROL', 'Petrol'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='vehicles')
    vehicle_number = models.CharField(max_length=20, unique=True, validators=[validate_vehicle_number])
    vehicle_type = models.CharField(max_length=20, choices=VEHICLE_TYPES)
    nickname = models.CharField(max_length=50, blank=True)
    
    engine_type = models.CharField(max_length=20, choices=ENGINE_TYPES, default='DIESEL')
    fuel_tank_capacity = models.IntegerField(null=True, blank=True)
    expected_mileage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    insurance_expiry = models.DateField(null=True, blank=True)
    permit_expiry = models.DateField(null=True, blank=True)
    puc_expiry = models.DateField(null=True, blank=True)
    fitness_expiry = models.DateField(null=True, blank=True)
    
    current_odometer = models.IntegerField(default=0)
    last_service_odometer = models.IntegerField(default=0)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.vehicle_number} ({self.vehicle_type})"
