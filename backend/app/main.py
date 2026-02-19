from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.api import auth, bookings, courts, health, payments, users
from app.core.config import settings
from app.core.logging import get_logger, setup_logging

logger = get_logger(__name__)


def get_application() -> FastAPI:
    """Create and configure the FastAPI application."""
    setup_logging()

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncGenerator:
        """Manage application lifecycle."""
        logger.info(f"Starting {settings.app_name} v{settings.app_version}")
        yield
        logger.info(f"Shutting down {settings.app_name}")

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="Production-grade Padel Court Booking System",
        docs_url="/api/docs" if settings.debug else None,
        redoc_url="/api/redoc" if settings.debug else None,
        openapi_url="/api/openapi.json" if settings.debug else None,
        lifespan=lifespan,
    )

    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"^https://.*\.app\.github\.dev$",
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Configure rate limiting
    limiter = Limiter(key_func=get_remote_address)
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # Register routers
    app.include_router(health.router, prefix="/api", tags=["Health"])
    app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
    app.include_router(users.router, prefix="/api/users", tags=["Users"])
    app.include_router(courts.router, prefix="/api/courts", tags=["Courts"])
    app.include_router(bookings.router, prefix="/api/bookings", tags=["Bookings"])
    app.include_router(payments.router, prefix="/api/payments", tags=["Payments"])

    # Global exception handler
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        """Handle uncaught exceptions."""
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "code": "INTERNAL_ERROR",
                "message": "An internal error occurred",
                "details": None if not settings.debug else {"error": str(exc)},
            },
        )

    return app


app = get_application()
