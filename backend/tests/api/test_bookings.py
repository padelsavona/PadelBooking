from datetime import datetime, timedelta

from fastapi.testclient import TestClient


def _future_time(hours: int) -> datetime:
    now = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
    return now + timedelta(days=1, hours=hours)


def test_player_can_create_booking(client: TestClient, player_token: str, sample_court):
    response = client.post(
        "/api/bookings",
        json={
            "court_id": sample_court.id,
            "start_time": _future_time(1).isoformat(),
            "end_time": _future_time(2).isoformat(),
            "notes": "Evening game",
        },
        headers={"Authorization": f"Bearer {player_token}"},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["court_id"] == sample_court.id
    assert body["payment_status"] == "pending"


def test_admin_can_block_timeslot(client: TestClient, admin_token: str, sample_court):
    response = client.post(
        "/api/bookings/block",
        json={
            "court_id": sample_court.id,
            "start_time": _future_time(3).isoformat(),
            "end_time": _future_time(4).isoformat(),
            "notes": "Maintenance",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["is_blocked"] is True
    assert body["payment_status"] == "waived"


def test_player_cannot_use_block_endpoint(client: TestClient, player_token: str, sample_court):
    response = client.post(
        "/api/bookings/block",
        json={
            "court_id": sample_court.id,
            "start_time": _future_time(5).isoformat(),
            "end_time": _future_time(6).isoformat(),
        },
        headers={"Authorization": f"Bearer {player_token}"},
    )

    assert response.status_code == 403
