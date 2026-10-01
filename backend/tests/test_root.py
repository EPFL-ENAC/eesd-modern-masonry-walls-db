import httpx

from modernmasonrydatabase import __version__
from modernmasonrydatabase.main import app


async def get(path: str) -> httpx.Response:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
        return await c.get(path)


async def test_root_returns_name_and_version():
    response = await get("/")
    assert response.status_code == 200
    assert response.json() == {"name": "modernmasonrydatabase", "version": __version__}


async def test_healthz():
    response = await get("/healthz")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
