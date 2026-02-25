from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    extension_link_token = models.CharField(
        max_length=128,
        blank=True,
        null=True
    )