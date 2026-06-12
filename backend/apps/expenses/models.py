from django.db import models
from django.conf import settings
from vehicles.models import Vehicle
from trips.models import Trip

class Expense(models.Model):
    CATEGORIES = [
        ('FUEL', 'Fuel'), ('TOLL', 'Toll'), ('REPAIR', 'Repair/Maintenance'),
        ('TYRE', 'Tyres'), ('OIL', 'Engine Oil'), ('SERVICE', 'Scheduled Service'),
        ('LOADING', 'Loading/Unloading'), ('PARKING', 'Parking'), ('FOOD', 'Food/Dhaba'),
        ('FINES', 'Fines/Challan'), ('INSURANCE', 'Insurance Premium'), ('FREIGHT', 'Freight'),
        ('OTHER', 'Other'),
    ]
    ENTRY_TYPES = [('EXPENSE', 'Expense'), ('INCOME', 'Income')]
    
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='expenses', null=True, blank=True)
    trip = models.ForeignKey(Trip, on_delete=models.SET_NULL, null=True, blank=True, related_name='expenses')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    category = models.CharField(max_length=15, choices=CATEGORIES)
    entry_type = models.CharField(max_length=7, choices=ENTRY_TYPES, default='EXPENSE')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    expense_date = models.DateField()
    description = models.TextField(blank=True, default='')
    
    litres = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    price_per_litre = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    odometer_reading = models.IntegerField(null=True, blank=True)
    fuel_station = models.CharField(max_length=100, blank=True)
    fuel_type = models.CharField(max_length=10, choices=[('DIESEL', 'Diesel'), ('PETROL', 'Petrol'), ('CNG', 'CNG')], default='DIESEL')
    
    receipt_image = models.FileField(upload_to='receipts/', null=True, blank=True)
    ocr_extracted = models.JSONField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.category} - {self.amount} ({self.expense_date})"
