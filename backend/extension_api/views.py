from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from jobs.models import JobApplication
from jobs.serializers import JobApplicationSerializer


class ExtensionJobIngestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        job_url = (request.data.get("job_url") or "").strip()
        job_title = (request.data.get("job_title") or "").strip()
        company_name = (request.data.get("company_name") or "").strip()

        if not job_url:
            return Response({"detail": "job_url is required."}, status=status.HTTP_400_BAD_REQUEST)

        if not job_title:
            return Response({"job_title": ["This field may not be blank."]}, status=status.HTTP_400_BAD_REQUEST)

        if not company_name:
            return Response({"company_name": ["This field may not be blank."]}, status=status.HTTP_400_BAD_REQUEST)

        defaults = {
            "job_title": job_title,
            "company_name": company_name,
            "location_type": request.data.get("location_type", "remote"),
            "status": request.data.get("status", "applied"),
            "referral": bool(request.data.get("referral", False)),
            "notes": request.data.get("notes", ""),
        }

        obj, created = JobApplication.objects.update_or_create(
            user=request.user,
            job_url=job_url,
            defaults=defaults,
        )

        data = JobApplicationSerializer(obj).data
        data["created"] = created

        return Response(data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)