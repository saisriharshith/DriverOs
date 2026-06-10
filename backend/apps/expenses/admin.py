from django.contrib import admin
from .models import Expense

@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('category', 'user', 'amount', 'expense_date')
    search_fields = ('user__phone', 'description')
    list_filter = ('category', 'expense_date')
    readonly_fields = ('created_at',)