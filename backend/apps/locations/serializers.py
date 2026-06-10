from rest_framework import serializers
from .models import Location

class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ['id', 'user', 'latitude', 'longitude', 'timestamp']
        read_only_fields = ['user', 'timestamp']
