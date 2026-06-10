from rest_framework import serializers
from .models import SOSEvent

class SOSEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = SOSEvent
        fields = '__all__'
        read_only_fields = ('user',)
