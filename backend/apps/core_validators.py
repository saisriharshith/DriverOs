import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

def validate_phone(value):
    if not re.match(r'^\d{10}$', value):
        raise ValidationError(_('Phone number must be exactly 10 digits.'))

def validate_vehicle_number(value):
    # Basic Indian Vehicle Number regex (e.g., TS09EA1234 or TS 09 EA 1234)
    pattern = r'^[A-Z]{2}[ -]?[0-9]{1,2}[ -]?[A-Z]{1,2}[ -]?[0-9]{4}$'
    if not re.match(pattern, value.upper()):
        raise ValidationError(_('Invalid vehicle number format.'))

def validate_file_extension(value):
    import os
    ext = os.path.splitext(value.name)[1]
    valid_extensions = ['.pdf', '.jpg', '.jpeg', '.png']
    if not ext.lower() in valid_extensions:
        raise ValidationError(_('Unsupported file extension. Use PDF, JPG, or PNG.'))
