import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.middleware import RequestLoggingMiddleware
from app.routers import ai, auth, briefings, files, gamification, reminders, tasks, users
from app.services.scheduler import start_scheduler, stop_scheduler

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")


# ────────────────────────────────────────────────────────────
# APPLICATION LIFESPAN (scheduler start/stop)
# ────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start background scheduler on startup, stop on shutdown."""
    start_scheduler()
    yield
    stop_scheduler()

app = FastAPI(
    title="ALIA API",
    version="1.0.0",
    description="AI Life Admin Assistant — Backend API",
    lifespan=lifespan,
)

# ────────────────────────────────────────────────────────────
# MIDDLEWARE
# ────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.add_middleware(RequestLoggingMiddleware)

# ────────────────────────────────────────────────────────────
# GLOBAL ERROR HANDLERS
# ────────────────────────────────────────────────────────────

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Normalize all HTTPException responses to a consistent JSON shape."""
    detail = exc.detail
    if isinstance(detail, dict) and "error" in detail:
        return JSONResponse(status_code=exc.status_code, content=detail)

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "message": str(detail),
            "code": _status_to_code(exc.status_code),
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Return validation errors in a consistent format."""
    errors = exc.errors()
    messages = "; ".join(
        f"{'.'.join(str(loc) for loc in e['loc'])}: {e['msg']}" for e in errors
    )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": True,
            "message": messages,
            "code": "VALIDATION_ERROR",
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Catch-all for unhandled exceptions."""
    logging.getLogger("alia").exception("Unhandled exception: %s", exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": True,
            "message": "An unexpected error occurred",
            "code": "INTERNAL_ERROR",
        },
    )


def _status_to_code(status_code: int) -> str:
    """Map HTTP status codes to ALIA error codes."""
    mapping = {
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        422: "VALIDATION_ERROR",
        500: "INTERNAL_ERROR",
    }
    return mapping.get(status_code, "INTERNAL_ERROR")


# ────────────────────────────────────────────────────────────
# ROUTERS
# ────────────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(tasks.router, prefix="/api/v1")
app.include_router(files.router, prefix="/api/v1")
app.include_router(reminders.router, prefix="/api/v1")
app.include_router(ai.router, prefix="/api/v1")
app.include_router(gamification.router, prefix="/api/v1")
app.include_router(briefings.router, prefix="/api/v1")

# ────────────────────────────────────────────────────────────
# HEALTH CHECKS
# ────────────────────────────────────────────────────────────

@app.get("/")
async def root_health():
    """Root health check."""
    return {"status": "ok", "version": "1.0.0"}


@app.get("/api/v1/health")
async def api_health():
    """Detailed API health check."""
    return {"status": "healthy", "env": settings.app_env}
