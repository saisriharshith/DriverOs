from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .views import AdminUserViewSet, AdminSOSEventViewSet, AdminLocationViewSet

router = SimpleRouter()
router.register(r'users', AdminUserViewSet, basename='admin-user')
router.register(r'emergencies', AdminSOSEventViewSet, basename='admin-emergency')
router.register(r'locations', AdminLocationViewSet, basename='admin-location')

urlpatterns = [
    path('', include(router.urls)),
]
