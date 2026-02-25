from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
import secrets

User = get_user_model()


# ---------------------------------------------
# Generate one-time extension link token
# ---------------------------------------------
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_extension_link_token(request):
    token = secrets.token_urlsafe(32)

    request.user.extension_link_token = token
    request.user.save(update_fields=["extension_link_token"])

    return Response({"token": token})


# ---------------------------------------------
# Exchange link token for JWT tokens
# ---------------------------------------------
@api_view(["POST"])
def exchange_extension_link_token(request):
    token = request.data.get("token")

    if not token:
        return Response({"detail": "token required"}, status=400)

    user = User.objects.filter(extension_link_token=token).first()

    if not user:
        return Response({"detail": "invalid token"}, status=401)

    # Clear token after use
    user.extension_link_token = ""
    user.save(update_fields=["extension_link_token"])

    refresh = RefreshToken.for_user(user)

    return Response({
        "refresh": str(refresh),
        "access": str(refresh.access_token)
    })