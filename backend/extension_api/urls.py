from django.urls import path
from .views import ExtensionJobIngestView

urlpatterns = [
    path("extension/jobs/", ExtensionJobIngestView.as_view(), name="extension-jobs-ingest"),
]
