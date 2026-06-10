import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils.translation import gettext_lazy as _

class UserManager(BaseUserManager):
    def create_user(self, phone, password=None, **extra_fields):
        if not phone:
            raise ValueError(_('The Phone number must be set'))
        user = self.model(phone=phone, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, phone, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'ADMIN')

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))

        return self.create_user(phone, password, **extra_fields)

from core_validators import validate_phone

class User(AbstractBaseUser, PermissionsMixin):
    class Roles(models.TextChoices):
        DRIVER = 'DRIVER', _('Driver')
        FLEET_OWNER = 'FLEET_OWNER', _('Fleet Owner')
        ADMIN = 'ADMIN', _('Admin')

    class Languages(models.TextChoices):
        EN = 'EN', _('English')
        HI = 'HI', _('Hindi')
        TE = 'TE', _('Telugu')
        TA = 'TA', _('Tamil')
        KN = 'KN', _('Kannada')
        MR = 'MR', _('Marathi')
        BN = 'BN', _('Bengali')
        ML = 'ML', _('Malayalam')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone = models.CharField(max_length=15, unique=True, validators=[validate_phone])
    name = models.CharField(max_length=255, blank=True)
    preferred_language = models.CharField(
        max_length=10, 
        choices=Languages.choices, 
        default=Languages.EN
    )
    role = models.CharField(
        max_length=20, 
        choices=Roles.choices, 
        default=Roles.DRIVER
    )
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'phone'
    REQUIRED_FIELDS = []

    def __str__(self):
        return f"{self.phone} ({self.role})"
