from django.db import models
from django.conf import settings

class ComplianceScore(models.Model):
    class RiskLevel(models.TextChoices):
        SAFE = 'SAFE', 'Safe'
        WARNING = 'WARNING', 'Warning'
        HIGH = 'HIGH', 'High Risk'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='compliance_scores')
    score = models.IntegerField(default=100)  # 0-100
    risk_level = models.CharField(max_length=20, choices=RiskLevel.choices, default=RiskLevel.SAFE)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Score for {self.user.phone}: {self.score} ({self.risk_level})"
