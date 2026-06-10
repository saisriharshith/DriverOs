from django.db import models
from django.conf import settings
from vehicles.models import Vehicle

class Expense(models.Model):
    class Categories(models.TextChoices):
        FUEL = 'FUEL', 'Fuel'
        TOLL = 'TOLL', 'Toll'
        PARKING = 'PARKING', 'Parking'
        REPAIR = 'REPAIR', 'Repair'
        LOADING = 'LOADING', 'Loading'
        OTHER = 'OTHER', 'Other'

    class EntryType(models.TextChoices):
        EXPENSE = 'EXPENSE', 'Expense'
        INCOME = 'INCOME', 'Income'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='expenses')
    vehicle = models.ForeignKey(Vehicle, on_delete=models.SET_NULL, null=True, blank=True, related_name='expenses')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    entry_type = models.CharField(max_length=10, choices=EntryType.choices, default=EntryType.EXPENSE)
    category = models.CharField(max_length=20, choices=Categories.choices)
    expense_date = models.DateField()
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.category} - {self.amount} ({self.expense_date})"
