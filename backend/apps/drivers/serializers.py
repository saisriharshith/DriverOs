from rest_framework import serializers
from .models import Driver, EmergencyContact, HealthRecord

class EmergencyContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmergencyContact
        fields = '__all__'
        read_only_fields = ('driver',)

class HealthRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = HealthRecord
        fields = '__all__'
        read_only_fields = ('driver',)

class DriverSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(source='user.phone', read_only=True)
    emergency_contacts = EmergencyContactSerializer(many=True, read_only=True)
    health_record = HealthRecordSerializer(read_only=True)
    height_cm = serializers.IntegerField(allow_null=True, required=False)
    weight_kg = serializers.IntegerField(allow_null=True, required=False)
    
    class Meta:
        model = Driver
        fields = '__all__'
        read_only_fields = ('user',)
