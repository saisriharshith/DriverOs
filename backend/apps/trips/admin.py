from django.contrib import admin
from .models import Trip

@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ('id', 'driver', 'vehicle', 'status', 'start_location', 'start_time')
    search_fields = ('driver__phone', 'vehicle__vehicle_number', 'start_location', 'end_location')
    list_filter = ('status', 'start_time')
    readonly_fields = ('start_time',)
