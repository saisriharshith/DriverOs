from rest_framework import viewsets, permissions
from authentication.models import User
from emergency.models import SOSEvent
from locations.models import Location
from .serializers import AdminUserSerializer, AdminSOSEventSerializer, AdminLocationSerializer

class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.role == 'ADMIN'

class AdminUserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

class AdminSOSEventViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SOSEvent.objects.all()
    serializer_class = AdminSOSEventSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

class AdminLocationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Location.objects.all()
    serializer_class = AdminLocationSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
