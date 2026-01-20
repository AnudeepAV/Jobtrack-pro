from datetime import date
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from jobs.models import JobApplication
from .serializers import ExtensionJobIngestSerializer


class ExtensionJobIngestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ExtensionJobIngestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Create if new URL, update if already exists (prevents duplicates)
        job, created = JobApplication.objects.update_or_create(
            user=request.user,
            job_url=data["job_url"],
            defaults={
                "company_name": data["company_name"],
                "job_title": data["job_title"],
                "location_type": data.get("location_type", JobApplication.LocationType.ONSITE),
                "referral": data.get("referral", False),
                "date_applied": date.today(),
                "status": data.get("status", JobApplication.Status.APPLIED),
                "notes": data.get("notes", ""),
            },
        )

        return Response(
            {"created": created, "job_id": job.id},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )
