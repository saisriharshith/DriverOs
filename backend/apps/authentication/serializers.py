from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'phone', 'name', 'preferred_language', 'role', 'created_at')
        read_only_fields = ('id', 'created_at')

class SendOTPSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=15)

class VerifyOTPSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=15)
    otp = serializers.CharField(max_length=6)
    role = serializers.ChoiceField(choices=User.Roles.choices, required=False)
    language = serializers.ChoiceField(choices=User.Languages.choices, required=False)
