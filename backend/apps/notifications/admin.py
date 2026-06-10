from django.contrib import admin
from .models import Notification

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'message', 'status', 'created_at')
    search_fields = ('user__phone', 'message')
    list_filter = ('status', 'created_at')
    readonly_fields = ('created_at',)