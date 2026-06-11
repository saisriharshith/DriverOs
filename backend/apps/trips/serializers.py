from rest_framework import serializers
from .models import Trip
from vehicles.serializers import VehicleSerializer

class TripSerializer(serializers.ModelSerializer):
    vehicle_detail = VehicleSerializer(source='vehicle', read_only=True)

    class Meta:
        model = Trip
        fields = '__all__'
        read_only_fields = ('driver',)