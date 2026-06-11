from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import MaintenanceSchedule, MaintenanceRecord
from .serializers import MaintenanceScheduleSerializer, MaintenanceRecordSerializer
from vehicles.models import Vehicle


class MaintenanceScheduleViewSet(viewsets.ModelViewSet):
    serializer_class = MaintenanceScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = MaintenanceSchedule.objects.none()

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return MaintenanceSchedule.objects.none()
        return MaintenanceSchedule.objects.filter(vehicle__user=self.request.user)

    def perform_create(self, serializer):
        vehicle_id = self.request.data.get('vehicle')
        vehicle = Vehicle.objects.get(id=vehicle_id, user=self.request.user)
        schedule = serializer.save(vehicle=vehicle)
        self._update_next_due(schedule)

    def perform_update(self, serializer):
        schedule = serializer.save()
        self._update_next_due(schedule)

    def _update_next_due(self, schedule):
        if schedule.last_done_odometer and schedule.interval_km:
            schedule.next_due_odometer = schedule.last_done_odometer + schedule.interval_km
        if schedule.last_done_date and schedule.interval_days:
            from datetime import timedelta
            schedule.next_due_date = schedule.last_done_date + timedelta(days=schedule.interval_days)
        
        # Update status
        vehicle = schedule.vehicle
        if schedule.next_due_odometer and vehicle.current_odometer >= schedule.next_due_odometer:
            schedule.status = 'OVERDUE'
        elif schedule.next_due_odometer and vehicle.current_odometer >= schedule.next_due_odometer - 500:
            schedule.status = 'DUE_SOON'
        else:
            schedule.status = 'OK'
        schedule.save(update_fields=['next_due_odometer', 'next_due_date', 'status'])

    @action(detail=False, methods=['get'], url_path='due')
    def due_maintenance(self, request):
        schedules = self.get_queryset().filter(is_active=True, status__in=['DUE_SOON', 'OVERDUE'])
        serializer = self.get_serializer(schedules, many=True)
        return Response(serializer.data)


class MaintenanceRecordViewSet(viewsets.ModelViewSet):
    serializer_class = MaintenanceRecordSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = MaintenanceRecord.objects.none()

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return MaintenanceRecord.objects.none()
        return MaintenanceRecord.objects.filter(vehicle__user=self.request.user)

    def perform_create(self, serializer):
        vehicle_id = self.request.data.get('vehicle')
        vehicle = Vehicle.objects.get(id=vehicle_id, user=self.request.user)
        record = serializer.save(vehicle=vehicle)
        
        # Update vehicle's last_service_odometer
        if record.odometer > vehicle.last_service_odometer:
            vehicle.last_service_odometer = record.odometer
            vehicle.save(update_fields=['last_service_odometer'])
        
        # Update related schedule
        if record.schedule:
            schedule = record.schedule
            schedule.last_done_odometer = record.odometer
            schedule.last_done_date = record.service_date
            if record.next_due_odometer:
                schedule.next_due_odometer = record.next_due_odometer
            schedule.save()
