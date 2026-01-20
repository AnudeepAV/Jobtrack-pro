from django.urls import path, include
from django.contrib import admin
from django.urls import path
from rest_framework.response import Response
from rest_framework.decorators import api_view
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


@api_view(["GET"])
def health(request):
    return Response({"status": "ok"})

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),


    path("api/health/", health),
    path("api/", include("extension_api.urls")),
 
    path("api/", include("jobs.urls")),


    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
]
