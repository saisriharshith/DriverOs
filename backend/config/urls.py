from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from rest_framework_simplejwt.views import TokenRefreshView

# Import views
from authentication.views import SendOTPView, VerifyOTPView, UserProfileView
from drivers.views import DriverViewSet, EmergencyContactViewSet, HealthRecordViewSet
from vehicles.views import VehicleViewSet
from documents.views import DocumentViewSet
from expenses.views import ExpenseViewSet
from notifications.views import NotificationViewSet
from trips.views import TripViewSet
from compliance.views import ComplianceScoreViewSet
from emergency.views import SOSEventViewSet
from analytics.views import DashboardStatsView
from ai_assistant.views import AssistantChatView
from ocr.views import OCRResultViewSet

router = DefaultRouter()
router.register(r'drivers', DriverViewSet, basename='driver')
router.register(r'emergency-contacts', EmergencyContactViewSet, basename='emergency-contact')
router.register(r'health-records', HealthRecordViewSet, basename='health-record')
router.register(r'vehicles', VehicleViewSet, basename='vehicle')
router.register(r'documents', DocumentViewSet, basename='document')
router.register(r'expenses', ExpenseViewSet, basename='expense')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'trips', TripViewSet, basename='trip')
router.register(r'compliance', ComplianceScoreViewSet, basename='compliance')
router.register(r'emergency/sos', SOSEventViewSet, basename='sos')
router.register(r'ocr', OCRResultViewSet, basename='ocr')

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Auth
    path('api/v1/auth/send-otp/', SendOTPView.as_view(), name='send-otp'),
    path('api/v1/auth/verify/', VerifyOTPView.as_view(), name='verify-otp'),
    path('api/v1/auth/profile/', UserProfileView.as_view(), name='user-profile'),
    path('api/v1/auth/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    
    # API v1
    path('api/v1/analytics/dashboard/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('api/v1/ai/chat/', AssistantChatView.as_view(), name='assistant-chat'),
    path('api/v1/locations/', include('locations.urls')),
    path('api/v1/admin-panel/', include('admin_api.urls')),
    path('api/v1/', include(router.urls)),
    
    # Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
