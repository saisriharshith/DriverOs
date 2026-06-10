from rest_framework import viewsets, permissions
from django.utils import timezone
from compliance.models import ComplianceScore
from .models import Document
from .serializers import DocumentSerializer

class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Document.objects.none()

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Document.objects.none()
        return Document.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        document = serializer.save(user=self.request.user)
        self._sync_document_status(document)
        self._recalculate_compliance(self.request.user)

    def perform_update(self, serializer):
        document = serializer.save()
        self._sync_document_status(document)
        self._recalculate_compliance(self.request.user)

    def perform_destroy(self, instance):
        user = self.request.user
        instance.delete()
        self._recalculate_compliance(user)

    def list(self, request, *args, **kwargs):
        for document in self.get_queryset():
            self._sync_document_status(document)
        self._recalculate_compliance(request.user)
        return super().list(request, *args, **kwargs)

    def _sync_document_status(self, document):
        if document.expiry_date and document.expiry_date < timezone.localdate():
            document.status = Document.Status.EXPIRED
        elif document.status == Document.Status.EXPIRED:
            document.status = Document.Status.VALID
        if document.expiry_date and document.status == Document.Status.PENDING:
            document.status = Document.Status.VALID
        document.save(update_fields=['status'])

    def _recalculate_compliance(self, user):
        documents = Document.objects.filter(user=user)
        expired = documents.filter(status=Document.Status.EXPIRED).count()
        pending = documents.filter(status=Document.Status.PENDING).count()
        soon = 0
        today = timezone.localdate()
        for document in documents.exclude(expiry_date__isnull=True):
            days_left = (document.expiry_date - today).days
            if 0 <= days_left <= 30:
                soon += 1

        penalty = (expired * 25) + (soon * 10) + (pending * 5)
        score = max(0, 100 - penalty)
        if score >= 75:
            risk = ComplianceScore.RiskLevel.SAFE
        elif score >= 50:
            risk = ComplianceScore.RiskLevel.WARNING
        else:
            risk = ComplianceScore.RiskLevel.HIGH

        ComplianceScore.objects.update_or_create(
            user=user,
            defaults={'score': score, 'risk_level': risk},
        )
