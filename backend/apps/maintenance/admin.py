from django.contrib import admin
from .models import MaintenanceSchedule, MaintenanceRecord

@admin.register(MaintenanceSchedule)
class MaintenanceScheduleAdmin(admin.ModelAdmin):
    list_display = ['vehicle', 'service_type', 'interval_km', 'interval_days', 'status', 'next_due_odometer', 'next_due_date', 'is_active']
    list_filter = ['service_type', 'status', 'is_active']
    search_fields = ['vehicle__vehicle_number']

@admin.register(MaintenanceRecord)
class MaintenanceRecordAdmin(admin.ModelAdmin):
    list_display = ['vehicle', 'service_type', 'odometer', 'cost', 'workshop', 'service_date']
    list_filter = ['service_type', 'service_date']
    search_fields = ['vehicle__vehicle_number', 'workshop']
