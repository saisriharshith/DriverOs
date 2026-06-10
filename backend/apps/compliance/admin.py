from django.contrib import admin
from .models import ComplianceScore

@admin.register(ComplianceScore)
class ComplianceScoreAdmin(admin.ModelAdmin):
    list_display = ('user', 'score', 'risk_level', 'last_updated')
    search_fields = ('user__phone',)
    list_filter = ('risk_level',)
    readonly_fields = ('last_updated',)