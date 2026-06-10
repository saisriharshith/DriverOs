from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Driver, EmergencyContact, HealthRecord
from .serializers import DriverSerializer, EmergencyContactSerializer, HealthRecordSerializer

class DriverViewSet(viewsets.ModelViewSet):
    serializer_class = DriverSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Driver.objects.none()

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Driver.objects.none()
        return Driver.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get', 'patch'], url_path='me')
    def me(self, request):
        driver, _ = Driver.objects.get_or_create(
            user=request.user,
            defaults={'license_number': f'TEMP-{request.user.id}'[:50]},
        )
        if request.method == 'PATCH':
            serializer = self.get_serializer(driver, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        return Response(self.get_serializer(driver).data)

class EmergencyContactViewSet(viewsets.ModelViewSet):
    serializer_class = EmergencyContactSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = EmergencyContact.objects.none()

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return EmergencyContact.objects.none()
        return EmergencyContact.objects.filter(driver__user=self.request.user)

    def perform_create(self, serializer):
        driver, _ = Driver.objects.get_or_create(user=self.request.user)
        serializer.save(driver=driver)

class HealthRecordViewSet(viewsets.ModelViewSet):
    serializer_class = HealthRecordSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = HealthRecord.objects.none()

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return HealthRecord.objects.none()
        return HealthRecord.objects.filter(driver__user=self.request.user)

    def perform_create(self, serializer):
        driver, _ = Driver.objects.get_or_create(user=self.request.user)
        serializer.save(driver=driver)
