from rest_framework import viewsets, permissions
from .models import Expense
from .serializers import ExpenseSerializer

class ExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Expense.objects.none()

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Expense.objects.none()
        return Expense.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
