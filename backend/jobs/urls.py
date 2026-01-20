from rest_framework.routers import DefaultRouter
from .views import JobApplicationViewSet

router = DefaultRouter()
router.register(r"jobs", JobApplicationViewSet, basename="jobs")

urlpatterns = router.urls
