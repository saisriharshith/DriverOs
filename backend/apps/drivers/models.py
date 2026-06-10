from django.db import models
from django.conf import settings

class Driver(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='driver_profile')
    license_number = models.CharField(max_length=50, unique=True)
    blood_group = models.CharField(max_length=10, blank=True, null=True)
    experience_years = models.PositiveIntegerField(default=0)
    state = models.CharField(max_length=100, blank=True, null=True)
    emergency_contact_name = models.CharField(max_length=255, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)
    allergies = models.TextField(blank=True)
    medical_conditions = models.TextField(blank=True)
    medications = models.TextField(blank=True)
    doctor_name = models.CharField(max_length=255, blank=True)
    height_cm = models.PositiveIntegerField(null=True, blank=True)
    weight_kg = models.PositiveIntegerField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Driver: {self.user.phone} - {self.license_number}"

class EmergencyContact(models.Model):
    driver = models.ForeignKey(Driver, on_delete=models.CASCADE, related_name='emergency_contacts')
    name = models.CharField(max_length=255)
    relationship = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20)
    is_primary = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.name} ({self.relationship}) - {self.driver.user.phone}"

class HealthRecord(models.Model):
    driver = models.OneToOneField(Driver, on_delete=models.CASCADE, related_name='health_record')
    blood_group = models.CharField(max_length=10, blank=True)
    allergies = models.TextField(blank=True)
    medical_conditions = models.TextField(blank=True)
    medications = models.TextField(blank=True)
    last_checkup = models.DateField(null=True, blank=True)
    doctor_name = models.CharField(max_length=255, blank=True)
    doctor_phone = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return f"Health Record for {self.driver.user.phone}"
