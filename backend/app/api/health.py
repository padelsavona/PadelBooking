import time
from typing import Any

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.core.config import settings
from app.db.session import engine, get_session

router = APIRouter()


@router.get("/health")
async def health() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy", "service": settings.app_name, "version": settings.app_version}


@router.get("/ready")
async def readiness(session: Session = Depends(get_session)) -> dict[str, Any]:
    """Readiness check endpoint - verifies database connectivity."""
    try:
        # Test database connection
        start = time.time()
        session.exec(select(1))
        db_latency = (time.time() - start) * 1000  # Convert to ms

        return {
            "status": "ready",
            "database": "connected",
            "db_latency_ms": round(db_latency, 2),
        }
    except Exception as e:
        return {
            "status": "not_ready",
            "database": "disconnected",
            "error": str(e),
        }


@router.get("/live")
async def liveness() -> dict[str, str]:
    """Liveness check endpoint."""
    return {"status": "alive"}
