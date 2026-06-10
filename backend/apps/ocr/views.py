from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from documents.models import Document
from .models import OCRResult
from .serializers import OCRResultSerializer


class OCRResultViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = OCRResultSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = OCRResult.objects.none()

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return OCRResult.objects.none()
        return OCRResult.objects.filter(document__user=self.request.user)

    @action(detail=False, methods=['post'], url_path='process/(?P<document_id>[^/.]+)')
    def process_document(self, request, document_id=None):
        try:
            document = Document.objects.get(id=document_id, user=request.user)
        except Document.DoesNotExist:
            return Response({'error': 'Document not found'}, status=status.HTTP_404_NOT_FOUND)

        # Create or get OCR result
        ocr_result, created = OCRResult.objects.get_or_create(document=document)

        # Mock OCR processing - in production, this would use actual OCR
        # For now, we'll return mock extracted data based on document type
        mock_data = self._mock_ocr_extraction(document.doc_type)
        
        ocr_result.extracted_text = mock_data['text']
        ocr_result.confidence_score = mock_data['confidence']
        ocr_result.is_processed = True
        ocr_result.save()

        # Update document with extracted data
        document.extracted_data = mock_data['structured_data']
        document.save(update_fields=['extracted_data'])

        return Response(OCRResultSerializer(ocr_result).data)

    def _mock_ocr_extraction(self, doc_type):
        """Mock OCR extraction based on document type"""
        mock_responses = {
            'LICENSE': {
                'text': 'Driving License\nNumber: DL1234567890\nName: Test Driver\nDOB: 01/01/1990\nValid Till: 01/01/2030',
                'confidence': 0.95,
                'structured_data': {
                    'number': 'DL1234567890',
                    'name': 'Test Driver',
                    'expiry': '2030-01-01'
                }
            },
            'RC': {
                'text': 'Registration Certificate\nVehicle: TS09EA1234\nOwner: Test Driver\nChassis: MA3ABC1234567890\nEngine: ENG123456',
                'confidence': 0.92,
                'structured_data': {
                    'number': 'TS09EA1234',
                    'vehicle_number': 'TS09EA1234'
                }
            },
            'INSURANCE': {
                'text': 'Vehicle Insurance Policy\nPolicy No: INS123456789\nVehicle: TS09EA1234\nValid: 01/01/2025 to 01/01/2026',
                'confidence': 0.93,
                'structured_data': {
                    'policy_number': 'INS123456789',
                    'expiry': '2026-01-01'
                }
            },
            'PUC': {
                'text': 'Pollution Under Control Certificate\nCertificate No: PUC123456\nVehicle: TS09EA1234\nValid Till: 01/07/2025',
                'confidence': 0.90,
                'structured_data': {
                    'certificate_number': 'PUC123456',
                    'expiry': '2025-07-01'
                }
            },
        }
        return mock_responses.get(doc_type, {
            'text': 'Document processed',
            'confidence': 0.85,
            'structured_data': {}
        })