from rest_framework import serializers
from .models import Driver, EmergencyContact, HealthRecord

class EmergencyContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmergencyContact
        fields = '__all__'

class HealthRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = HealthRecord
        fields = '__all__'

class DriverSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(source='user.phone', read_only=True)
    emergency_contacts = EmergencyContactSerializer(many=True, read_only=True)
    health_record = HealthRecordSerializer(read_only=True)
    
    class Meta:
        model = Driver
        fields = '__all__'
        read_only_fields = ('user',)
