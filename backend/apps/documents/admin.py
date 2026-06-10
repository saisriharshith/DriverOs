from django.contrib import admin
from .models import Document

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('doc_type', 'user', 'vehicle', 'expiry_date', 'status', 'upload_date')
    search_fields = ('user__phone', 'vehicle__vehicle_number')
    list_filter = ('doc_type', 'status')
    readonly_fields = ('upload_date',)
