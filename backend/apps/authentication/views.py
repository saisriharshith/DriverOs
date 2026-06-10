from rest_framework import status, views
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User
from .serializers import SendOTPSerializer, VerifyOTPSerializer, UserSerializer
from django.utils.translation import gettext_lazy as _
from django.core.cache import cache
from drf_spectacular.utils import extend_schema
import random

class SendOTPView(views.APIView):
    permission_classes = [AllowAny]
    
    @extend_schema(request=SendOTPSerializer, responses={200: {"type": "object", "properties": {"message": {"type": "string"}}}})
    def post(self, request):
        serializer = SendOTPSerializer(data=request.data)
        if serializer.is_valid():
            phone = serializer.validated_data['phone']
            print(f"DEBUG: Sending OTP 123456 to {phone}")
            return Response({"message": _("OTP sent successfully")}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VerifyOTPView(views.APIView):
    permission_classes = [AllowAny]
    
    @extend_schema(request=VerifyOTPSerializer, responses={200: UserSerializer})
    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        if serializer.is_valid():
            phone = serializer.validated_data['phone']
            otp = serializer.validated_data['otp']
            role = serializer.validated_data.get('role', User.Roles.DRIVER)
            language = serializer.validated_data.get('language', User.Languages.EN)
            
            if otp == '123456':
                user, created = User.objects.get_or_create(
                    phone=phone,
                    defaults={'role': role, 'preferred_language': language}
                )
                
                if not created:
                    user.role = role
                    user.preferred_language = language
                    user.save()

                refresh = RefreshToken.for_user(user)
                return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'user': UserSerializer(user, context={'request': request}).data
                }, status=status.HTTP_200_OK)
            
            return Response({"error": _("Invalid OTP")}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(views.APIView):
    permission_classes = [IsAuthenticated]
    
    @extend_schema(responses=UserSerializer)
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
