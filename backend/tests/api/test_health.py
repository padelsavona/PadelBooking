from fastapi.testclient import TestClient


def test_health_endpoint(client: TestClient):
    """Test health check endpoint."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "service" in data
    assert "version" in data


def test_readiness_endpoint(client: TestClient):
    """Test readiness check endpoint."""
    response = client.get("/api/ready")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "database" in data


def test_liveness_endpoint(client: TestClient):
    """Test liveness check endpoint."""
    response = client.get("/api/live")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "alive"
