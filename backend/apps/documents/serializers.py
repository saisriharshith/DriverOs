from rest_framework import serializers
from .models import Document
from vehicles.serializers import VehicleSerializer

class DocumentSerializer(serializers.ModelSerializer):
    file_url = serializers.FileField(use_url=True)
    vehicle_detail = VehicleSerializer(source='vehicle', read_only=True)

    class Meta:
        model = Document
        fields = '__all__'
        read_only_fields = ('user',)
