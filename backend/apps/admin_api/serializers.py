from rest_framework import serializers
from authentication.models import User
from emergency.models import SOSEvent
from locations.models import Location

class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'phone', 'name', 'role', 'preferred_language', 'is_active', 'created_at']

class AdminSOSEventSerializer(serializers.ModelSerializer):
    user_phone = serializers.CharField(source='user.phone', read_only=True)
    class Meta:
        model = SOSEvent
        fields = '__all__'

class AdminLocationSerializer(serializers.ModelSerializer):
    user_phone = serializers.CharField(source='user.phone', read_only=True)
    class Meta:
        model = Location
        fields = '__all__'
