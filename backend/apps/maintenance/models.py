from django.db import models
from django.conf import settings
from vehicles.models import Vehicle

class MaintenanceSchedule(models.Model):
    SERVICE_TYPES = [
        ('ENGINE_OIL', 'Engine Oil Change'), ('GEAR_OIL', 'Gear Oil'),
        ('COOLANT', 'Coolant'), ('FILTER_AIR', 'Air Filter'),
        ('FILTER_DIESEL', 'Diesel Filter'), ('FILTER_OIL', 'Oil Filter'),
        ('TYRE_ROTATION', 'Tyre Rotation'), ('BRAKE_CHECK', 'Brake Check'),
        ('GREASING', 'Greasing'), ('FULL_SERVICE', 'Full Service'),
    ]
    
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='maintenance_schedules')
    service_type = models.CharField(max_length=20, choices=SERVICE_TYPES)
    interval_km = models.IntegerField()
    interval_days = models.IntegerField(null=True, blank=True)
    last_done_odometer = models.IntegerField(default=0)
    last_done_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    next_due_odometer = models.IntegerField(default=0)
    next_due_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=[('OK', 'OK'), ('DUE_SOON', 'Due Soon'), ('OVERDUE', 'Overdue')], default='OK')

    def __str__(self):
        return f"{self.vehicle.vehicle_number} - {self.get_service_type_display()}"


class MaintenanceRecord(models.Model):
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='maintenance_records')
    schedule = models.ForeignKey(MaintenanceSchedule, on_delete=models.SET_NULL, null=True, blank=True)
    service_type = models.CharField(max_length=20, choices=MaintenanceSchedule.SERVICE_TYPES)
    odometer = models.IntegerField()
    cost = models.DecimalField(max_digits=10, decimal_places=2)
    workshop = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    service_date = models.DateField()
    next_due_odometer = models.IntegerField(null=True, blank=True)
    receipt_image = models.FileField(upload_to='maintenance/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.vehicle.vehicle_number} - {self.get_service_type_display()} - {self.service_date}"
