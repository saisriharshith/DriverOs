from rest_framework import viewsets, permissions
from .models import Trip
from .serializers import TripSerializer

class TripViewSet(viewsets.ModelViewSet):
    serializer_class = TripSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Trip.objects.none()

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Trip.objects.none()
        return Trip.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
