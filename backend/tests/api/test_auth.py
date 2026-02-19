from fastapi.testclient import TestClient


def test_register_user(client: TestClient):
    """Test user registration."""
    response = client.post(
        "/api/auth/register",
        json={
            "email": "newuser@example.com",
            "full_name": "New User",
            "password": "SecurePassword123",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["full_name"] == "New User"
    assert "id" in data


def test_register_duplicate_email(client: TestClient):
    """Test registering with duplicate email."""
    user_data = {
        "email": "duplicate@example.com",
        "full_name": "Duplicate User",
        "password": "Password123",
    }
    # Register once
    response = client.post("/api/auth/register", json=user_data)
    assert response.status_code == 201

    # Try to register again
    response = client.post("/api/auth/register", json=user_data)
    assert response.status_code == 400


def test_login_success(client: TestClient):
    """Test successful login."""
    # Register user
    client.post(
        "/api/auth/register",
        json={
            "email": "login@example.com",
            "full_name": "Login User",
            "password": "LoginPassword123",
        },
    )

    # Login
    response = client.post(
        "/api/auth/login",
        data={"username": "login@example.com", "password": "LoginPassword123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_invalid_credentials(client: TestClient):
    """Test login with invalid credentials."""
    response = client.post(
        "/api/auth/login",
        data={"username": "nonexistent@example.com", "password": "WrongPassword"},
    )
    assert response.status_code == 401


def test_password_validation(client: TestClient):
    """Test password validation rules."""
    # Missing uppercase
    response = client.post(
        "/api/auth/register",
        json={
            "email": "weak1@example.com",
            "full_name": "Weak User",
            "password": "password123",
        },
    )
    assert response.status_code == 422

    # Missing lowercase
    response = client.post(
        "/api/auth/register",
        json={
            "email": "weak2@example.com",
            "full_name": "Weak User",
            "password": "PASSWORD123",
        },
    )
    assert response.status_code == 422

    # Missing digit
    response = client.post(
        "/api/auth/register",
        json={
            "email": "weak3@example.com",
            "full_name": "Weak User",
            "password": "PasswordOnly",
        },
    )
    assert response.status_code == 422
