from django.db import models
from django.conf import settings

class SOSEvent(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        RESOLVED = 'RESOLVED', 'Resolved'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sos_events')
    location_lat = models.DecimalField(max_digits=9, decimal_places=6)
    location_long = models.DecimalField(max_digits=9, decimal_places=6)
    type = models.CharField(max_length=50, default='SOS')  # SOS / Accident
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.type} by {self.user.phone} at {self.created_at}"