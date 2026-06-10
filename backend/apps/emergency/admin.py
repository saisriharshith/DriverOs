from django.contrib import admin
from .models import SOSEvent

@admin.register(SOSEvent)
class SOSEventAdmin(admin.ModelAdmin):
    list_display = ('user', 'type', 'status', 'created_at')
    list_filter = ('status', 'type')
