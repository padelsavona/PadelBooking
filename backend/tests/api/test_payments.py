from datetime import datetime, timedelta
from unittest.mock import patch

from fastapi.testclient import TestClient


def _future_time(hours: int) -> datetime:
    now = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
    return now + timedelta(days=1, hours=hours)


@patch("app.api.payments.stripe.checkout.Session.create")
def test_create_checkout_session_for_player(
    mocked_create,
    client: TestClient,
    player_token: str,
    sample_court,
):
    mocked_create.return_value = type("CheckoutSession", (), {"id": "cs_test_123", "url": "https://stripe.test/checkout"})()

    booking_response = client.post(
        "/api/bookings",
        json={
            "court_id": sample_court.id,
            "start_time": _future_time(1).isoformat(),
            "end_time": _future_time(2).isoformat(),
        },
        headers={"Authorization": f"Bearer {player_token}"},
    )
    booking_id = booking_response.json()["id"]

    response = client.post(
        "/api/payments/create-checkout-session",
        json={"booking_id": booking_id},
        headers={"Authorization": f"Bearer {player_token}"},
    )

    assert response.status_code == 200
    assert response.json()["checkout_url"] == "https://stripe.test/checkout"


@patch("app.api.payments.stripe.checkout.Session.create")
def test_admin_cannot_create_checkout_session(
    mocked_create,
    client: TestClient,
    admin_token: str,
):
    del mocked_create
    response = client.post(
        "/api/payments/create-checkout-session",
        json={"booking_id": 1},
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert response.status_code == 403
