from rest_framework import viewsets, permissions
from .models import Location
from .serializers import LocationSerializer

class LocationViewSet(viewsets.ModelViewSet):
    serializer_class = LocationSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Location.objects.none()

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Location.objects.none()
        return Location.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
