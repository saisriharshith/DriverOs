from rest_framework import serializers
from .models import MaintenanceSchedule, MaintenanceRecord
from vehicles.serializers import VehicleSerializer

class MaintenanceScheduleSerializer(serializers.ModelSerializer):
    vehicle_detail = VehicleSerializer(source='vehicle', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    service_type_display = serializers.CharField(source='get_service_type_display', read_only=True)
    
    class Meta:
        model = MaintenanceSchedule
        fields = '__all__'
        read_only_fields = ('vehicle', 'next_due_odometer', 'next_due_date', 'status')


class MaintenanceRecordSerializer(serializers.ModelSerializer):
    vehicle_detail = VehicleSerializer(source='vehicle', read_only=True)
    service_type_display = serializers.CharField(source='get_service_type_display', read_only=True)
    
    class Meta:
        model = MaintenanceRecord
        fields = '__all__'
        read_only_fields = ('vehicle',)
