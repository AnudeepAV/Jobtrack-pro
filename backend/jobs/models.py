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

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="job_applications",
    )

    company_name = models.CharField(max_length=120)
    job_title = models.CharField(max_length=160)
    job_url = models.URLField()
    location_type = models.CharField(
        max_length=10, choices=LocationType.choices, default=LocationType.ONSITE
    )
    referral = models.BooleanField(default=False)
    date_applied = models.DateField()
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.APPLIED
    )
    notes = models.TextField(blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date_applied", "-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "job_url"], name="unique_job_url_per_user"
            )
        ]

    def __str__(self):
        return f"{self.company_name} - {self.job_title}"
