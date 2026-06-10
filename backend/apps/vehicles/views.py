from rest_framework import viewsets, permissions
from .models import Vehicle
from .serializers import VehicleSerializer

class VehicleViewSet(viewsets.ModelViewSet):
    serializer_class = VehicleSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Vehicle.objects.none()

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Vehicle.objects.none()
        return Vehicle.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
