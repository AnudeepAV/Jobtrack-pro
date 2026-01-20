from rest_framework import serializers
from jobs.models import JobApplication


class ExtensionJobIngestSerializer(serializers.Serializer):
    company_name = serializers.CharField(max_length=120)
    job_title = serializers.CharField(max_length=160)
    job_url = serializers.URLField()

    location_type = serializers.ChoiceField(
        choices=JobApplication.LocationType.choices,
        required=False,
        default=JobApplication.LocationType.ONSITE,
    )
    referral = serializers.BooleanField(required=False, default=False)
    status = serializers.ChoiceField(
        choices=JobApplication.Status.choices,
        required=False,
        default=JobApplication.Status.APPLIED,
    )
    notes = serializers.CharField(required=False, allow_blank=True, default="")
