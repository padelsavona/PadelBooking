from sqlmodel import Session, create_engine
from sqlalchemy.pool import StaticPool

from app.core.config import settings

# Create database engine
if "sqlite" in settings.database_url:
    # SQLite for testing
    engine = create_engine(
        settings.database_url,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
else:
    # PostgreSQL for production
    engine = create_engine(settings.database_url, pool_pre_ping=True, echo=settings.debug)


def get_session() -> Session:
    """Dependency to get database session."""
    with Session(engine) as session:
        yield session
