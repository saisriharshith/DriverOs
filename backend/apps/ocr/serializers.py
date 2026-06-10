from rest_framework import serializers
from .models import OCRResult


class OCRResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = OCRResult
        fields = ['id', 'document', 'extracted_text', 'confidence_score', 'processed_at', 'is_processed']
        read_only_fields = ['id', 'processed_at']