from django.contrib import admin
from django.urls import path
from rest_framework.response import Response
from rest_framework.decorators import api_view
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

@api_view(["GET"])
def health(request):
    return Response({"status": "ok"})

urlpatterns = [
    path("admin/", admin.site.urls),

    path("api/health/", health),

    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
]
