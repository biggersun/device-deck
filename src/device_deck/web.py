from importlib.resources import files
import json

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse, Response, JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.middleware.trustedhost import TrustedHostMiddleware

from .models import Credential, Device, Inventory
from .service import Hub


def create_app(home=None):
    hub = Hub(home)
    app = FastAPI(title="DeviceDeck", docs_url=None, redoc_url=None)
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=["127.0.0.1", "localhost", "[::1]"])
    static = files("device_deck") / "static"

    @app.middleware("http")
    async def local_origin(request, call_next):
        origin = request.headers.get("origin")
        expected = str(request.base_url).rstrip("/")
        if origin and origin != expected:
            return JSONResponse({"error": "Cross-origin access is not allowed"}, status_code=403)
        if request.method not in ("GET", "HEAD", "OPTIONS") and origin != expected:
            return JSONResponse({"error": "Mutation requires same-origin browser access"}, status_code=403)
        if request.headers.get("sec-fetch-site") == "cross-site":
            return JSONResponse({"error": "Cross-site access is not allowed"}, status_code=403)
        response = await call_next(request)
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Cache-Control"] = "no-store"
        return response

    @app.exception_handler(KeyError)
    async def not_found(request, error):
        return JSONResponse({"error": "Registered device or endpoint not found"}, status_code=404)

    @app.exception_handler(RequestValidationError)
    async def invalid_payload(request, error):
        return JSONResponse({"error": "Invalid registration data; secret fields are not accepted",
                             "fields": [list(e["loc"]) for e in error.errors()]}, status_code=422)

    @app.exception_handler(ValueError)
    async def invalid(request, error):
        return JSONResponse({"error": str(error)}, status_code=400)

    @app.get("/", response_class=HTMLResponse)
    def index():
        return (static / "index.html").read_text(encoding="utf-8")

    @app.get("/assets/{name}")
    def asset(name: str):
        if name not in ("app.js", "style.css"):
            raise HTTPException(status_code=404)
        mime = "text/javascript" if name.endswith(".js") else "text/css"
        return Response((static / name).read_text(encoding="utf-8"), media_type=mime)

    @app.get("/api/devices")
    def list_devices(limit: int = 50, offset: int = 0):
        return hub.store.list_devices(limit, offset)

    @app.get("/api/credentials")
    def list_credentials():
        return hub.store.credentials()

    @app.get("/api/events")
    def events():
        return hub.store.events()

    @app.post("/api/credentials")
    def upsert_credential(credential: Credential):
        return hub.store.import_inventory(Inventory(credentials=[credential]), "web")

    @app.post("/api/devices")
    def upsert_device(device: Device):
        return hub.store.import_inventory(Inventory(devices=[device]), "web")

    @app.get("/api/devices/{device_id}/endpoints/{endpoint_id}/plan")
    def connection_plan(device_id: str, endpoint_id: str):
        return hub.plan(device_id, endpoint_id)

    @app.post("/api/devices/{device_id}/endpoints/{endpoint_id}/probe")
    def probe(device_id: str, endpoint_id: str):
        return hub.probe(device_id, endpoint_id, "web")

    return app
