from django.contrib import admin
from .models import Vehicle

@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ('vehicle_number', 'user', 'vehicle_type', 'insurance_expiry', 'permit_expiry')
    search_fields = ('vehicle_number', 'user__phone')
    list_filter = ('vehicle_type',)
    readonly_fields = ('created_at',)
