from django.db import models
from django.conf import settings
from vehicles.models import Vehicle
from core_validators import validate_file_extension

class Document(models.Model):
    class DocumentTypes(models.TextChoices):
        LICENSE = 'LICENSE', 'Driving License'
        RC = 'RC', 'Registration Certificate'
        INSURANCE = 'INSURANCE', 'Insurance'
        PUC = 'PUC', 'Pollution Under Control'
        PERMIT = 'PERMIT', 'Permit'
        FITNESS = 'FITNESS', 'Fitness Certificate'
        OTHER = 'OTHER', 'Other'

    class Status(models.TextChoices):
        VALID = 'VALID', 'Valid'
        EXPIRED = 'EXPIRED', 'Expired'
        PENDING = 'PENDING', 'Pending Verification'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='documents')
    vehicle = models.ForeignKey(Vehicle, on_delete=models.SET_NULL, null=True, blank=True, related_name='documents')
    doc_type = models.CharField(max_length=20, choices=DocumentTypes.choices)
    file_url = models.FileField(upload_to='documents/', validators=[validate_file_extension])
    expiry_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    upload_date = models.DateTimeField(auto_now_add=True)
    
    # OCR extracted data (cached)
    extracted_data = models.JSONField(null=True, blank=True)

    def __str__(self):
        return f"{self.doc_type} - {self.user.phone}"