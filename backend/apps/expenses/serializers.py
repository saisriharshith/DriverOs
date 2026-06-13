from rest_framework import serializers
from .models import Expense
from vehicles.serializers import VehicleSerializer

class ExpenseSerializer(serializers.ModelSerializer):
    vehicle_detail = VehicleSerializer(source='vehicle', read_only=True)
    trip_detail = serializers.SerializerMethodField()

    class Meta:
        model = Expense
        fields = '__all__'
        read_only_fields = ('user',)

    def get_trip_detail(self, obj):
        if obj.trip:
            return f"{obj.trip.start_location} → {obj.trip.end_location}"
        return None
