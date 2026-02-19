from app.core.security import verify_password, get_password_hash, create_access_token, decode_access_token


def test_password_hashing():
    """Test password hashing and verification."""
    password = "TestPassword123"
    hashed = get_password_hash(password)

    assert hashed != password
    assert verify_password(password, hashed)
    assert not verify_password("WrongPassword", hashed)


def test_create_and_decode_token():
    """Test JWT token creation and decoding."""
    data = {"sub": "123", "email": "test@example.com", "role": "user"}
    token = create_access_token(data)

    assert isinstance(token, str)

    decoded = decode_access_token(token)
    assert decoded is not None
    assert decoded["sub"] == "123"
    assert decoded["email"] == "test@example.com"
    assert decoded["role"] == "user"


def test_decode_invalid_token():
    """Test decoding an invalid token."""
    invalid_token = "invalid.token.here"
    decoded = decode_access_token(invalid_token)
    assert decoded is None
