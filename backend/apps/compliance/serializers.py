from rest_framework import serializers
from .models import ComplianceScore

class ComplianceScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComplianceScore
        fields = '__all__'
        read_only_fields = ('user',)
