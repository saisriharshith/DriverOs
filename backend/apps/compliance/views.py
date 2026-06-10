from rest_framework import viewsets, permissions
from .models import ComplianceScore
from .serializers import ComplianceScoreSerializer

class ComplianceScoreViewSet(viewsets.ModelViewSet):
    serializer_class = ComplianceScoreSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = ComplianceScore.objects.none()

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return ComplianceScore.objects.none()
        return ComplianceScore.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
