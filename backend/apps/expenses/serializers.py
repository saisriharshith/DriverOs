from rest_framework import serializers
from .models import Expense
from vehicles.serializers import VehicleSerializer

class ExpenseSerializer(serializers.ModelSerializer):
    vehicle_detail = VehicleSerializer(source='vehicle', read_only=True)

    class Meta:
        model = Expense
        fields = '__all__'
        read_only_fields = ('user',)
