from fastapi import APIRouter

from modernmasonrydatabase import __name__ as name
from modernmasonrydatabase import __version__
from modernmasonrydatabase.models import Info

router = APIRouter()


@router.get("/", response_model=Info)
async def root() -> Info:
    return Info(name=name, version=__version__)


@router.get("/healthz")
async def healthz() -> dict[str, str]:
    return {"status": "ok"}
