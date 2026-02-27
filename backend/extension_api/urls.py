from django.urls import path
from . import views

urlpatterns = [
    path("extension/jobs/", views.ExtensionJobIngestView.as_view(), name="extension_jobs_ingest"),
]