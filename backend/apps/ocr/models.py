from django.db import models
from django.conf import settings
from documents.models import Document


class OCRResult(models.Model):
    document = models.OneToOneField(Document, on_delete=models.CASCADE, related_name='ocr_result')
    extracted_text = models.TextField(blank=True)
    confidence_score = models.FloatField(null=True, blank=True)
    processed_at = models.DateTimeField(auto_now_add=True)
    is_processed = models.BooleanField(default=False)

    def __str__(self):
        return f"OCR Result for {self.document}"