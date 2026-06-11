from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MaintenanceScheduleViewSet, MaintenanceRecordViewSet

router = DefaultRouter()
router.register(r'schedules', MaintenanceScheduleViewSet, basename='maintenance-schedule')
router.register(r'records', MaintenanceRecordViewSet, basename='maintenance-record')

urlpatterns = [
    path('', include(router.urls)),
]
