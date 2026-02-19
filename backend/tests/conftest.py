import pytest
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool
from fastapi.testclient import TestClient

from app.main import app
from app.db.session import get_session
from app.models import User
from app.core.security import get_password_hash


@pytest.fixture(name="session")
def session_fixture():
    """Create a test database session."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session):
    """Create a test client with overridden database session."""

    def get_session_override():
        return session

    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


@pytest.fixture(name="test_user")
def test_user_fixture(session: Session):
    """Create a test user."""
    user = User(
        email="test@example.com",
        full_name="Test User",
        hashed_password=get_password_hash("TestPassword123"),
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture(name="admin_user")
def admin_user_fixture(session: Session):
    """Create a test admin user."""
    from app.models import UserRole

    user = User(
        email="admin@example.com",
        full_name="Admin User",
        hashed_password=get_password_hash("AdminPassword123"),
        role=UserRole.ADMIN,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture(name="auth_token")
def auth_token_fixture(client: TestClient):
    """Get authentication token for test user."""
    # First register the user
    client.post(
        "/api/auth/register",
        json={
            "email": "auth@example.com",
            "full_name": "Auth User",
            "password": "AuthPassword123",
        },
    )
    # Then login
    response = client.post(
        "/api/auth/login",
        data={"username": "auth@example.com", "password": "AuthPassword123"},
    )
    return response.json()["access_token"]
