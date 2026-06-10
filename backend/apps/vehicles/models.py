from django.db import models
from django.conf import settings

from core_validators import validate_vehicle_number

class Vehicle(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='vehicles')
    vehicle_number = models.CharField(max_length=20, unique=True, validators=[validate_vehicle_number])
    vehicle_type = models.CharField(max_length=50)  # e.g., Truck, Taxi, Auto
    insurance_expiry = models.DateField(null=True, blank=True)
    permit_expiry = models.DateField(null=True, blank=True)
    puc_expiry = models.DateField(null=True, blank=True, verbose_name="PUC Expiry")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.vehicle_number} ({self.vehicle_type})"
