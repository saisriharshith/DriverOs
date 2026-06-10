from rest_framework import viewsets, permissions
from .models import SOSEvent
from .serializers import SOSEventSerializer

class SOSEventViewSet(viewsets.ModelViewSet):
    serializer_class = SOSEventSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = SOSEvent.objects.none()

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return SOSEvent.objects.none()
        return SOSEvent.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
