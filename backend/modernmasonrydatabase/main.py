"""
Entrypoint for the FastAPI application
"""

from fastapi import FastAPI

from modernmasonrydatabase import __name__ as title
from modernmasonrydatabase import __version__
from modernmasonrydatabase.config import settings
from modernmasonrydatabase.contribution_api import contribution_routes
from modernmasonrydatabase.routers import root

app = FastAPI(title=title, version=__version__, root_path=settings.root_path)
app.include_router(root.router)
# No prefix: the ingress strips /api before the request reaches the app.
app.include_router(contribution_routes(settings))
