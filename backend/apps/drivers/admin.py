from django.contrib import admin
from .models import Driver

@admin.register(Driver)
class DriverAdmin(admin.ModelAdmin):
    list_display = ('user', 'license_number', 'blood_group', 'experience_years', 'state')
    search_fields = ('user__phone', 'license_number', 'user__name')
    list_filter = ('state', 'blood_group')
