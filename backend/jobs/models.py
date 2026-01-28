from django.conf import settings
from django.db import models


class JobApplication(models.Model):
    class LocationType(models.TextChoices):
        ONSITE = "onsite", "Onsite"
        REMOTE = "remote", "Remote"
        HYBRID = "hybrid", "Hybrid"

    class Status(models.TextChoices):
        APPLIED = "applied", "Applied"
        IN_PROGRESS = "in_progress", "In Progress"
        ACCEPTED = "accepted", "Accepted"
        REJECTED = "rejected", "Rejected"
        GHOSTED = "ghosted", "Ghosted"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="job_applications")

    company_name = models.CharField(max_length=120)
    job_title = models.CharField(max_length=160)
    job_url = models.URLField(unique=True)

    location_type = models.CharField(max_length=20, choices=LocationType.choices, default=LocationType.ONSITE)
    referral = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.APPLIED)

    date_applied = models.DateField(null=True, blank=True)

    # ✅ NEW
    notes = models.TextField(blank=True, default="")
    follow_up_date = models.DateField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.company_name} - {self.job_title}"
