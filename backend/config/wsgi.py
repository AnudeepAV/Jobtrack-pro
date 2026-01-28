import os
from django.core.wsgi import get_wsgi_application

# Use production settings on Render, else default to config.settings
if os.getenv("RENDER", "").lower() == "true":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings_prod")
else:
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

application = get_wsgi_application()
