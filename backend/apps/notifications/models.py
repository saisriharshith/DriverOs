from django.db import models
from django.conf import settings

class Notification(models.Model):
    class Status(models.TextChoices):
        READ = 'READ', 'Read'
        UNREAD = 'UNREAD', 'Unread'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.UNREAD)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.user.phone}: {self.message[:50]}..."