from typing import Any

import stripe
from fastapi import Response
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlmodel import Session

from app.api.auth import get_current_user
from app.core.config import settings
from app.db.session import get_session
from app.models import Booking, BookingStatus, PaymentStatus, User, UserRole
from app.schemas import CheckoutRequest, CheckoutResponse

router = APIRouter()


def _configure_stripe() -> None:
    if not settings.payments_enabled:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Pagamenti disabilitati",
        )
    if not settings.stripe_secret_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe non è configurato",
        )
    stripe.api_key = settings.stripe_secret_key


@router.post("/create-checkout-session", response_model=CheckoutResponse)
async def create_checkout_session(
    payload: CheckoutRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> CheckoutResponse:
    """Crea una sessione Stripe per una prenotazione, se abilitato."""
    if not settings.payments_enabled:
        raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Pagamenti disabilitati")

    if current_user.role != UserRole.USER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo gli utenti player possono pagare con Stripe",
        )

    booking = session.get(Booking, payload.booking_id)
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prenotazione non trovata")

    if booking.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Non autorizzato a pagare questa prenotazione",
        )

    if booking.is_blocked:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Non puoi pagare slot bloccati",
        )

    if booking.payment_status != PaymentStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Prenotazione già processata",
        )

    _configure_stripe()

    checkout_session = stripe.checkout.Session.create(
        mode="payment",
        payment_method_types=["card"],
        line_items=[
            {
                "quantity": 1,
                "price_data": {
                    "currency": settings.stripe_currency,
                    "product_data": {
                        "name": f"Padel court booking #{booking.id}",
                    },
                    "unit_amount": int(booking.total_price * 100),
                },
            }
        ],
        metadata={
            "booking_id": str(booking.id),
            "user_id": str(current_user.id),
        },
        success_url=settings.stripe_success_url,
        cancel_url=settings.stripe_cancel_url,
    )

    booking.stripe_session_id = checkout_session.id
    session.add(booking)
    session.commit()

    return CheckoutResponse(checkout_url=checkout_session.url)


@router.post("/webhook", status_code=status.HTTP_204_NO_CONTENT)
async def stripe_webhook(
    request: Request,
    stripe_signature: str | None = Header(default=None, alias="stripe-signature"),
    session: Session = Depends(get_session),
) -> None:
    """Gestisce i webhook Stripe, se abilitato."""
    if not settings.payments_enabled:
        raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Pagamenti disabilitati")

    _configure_stripe()

    payload = await request.body()

    if not settings.stripe_webhook_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe webhook secret non configurato",
        )

    try:
        event: Any = stripe.Webhook.construct_event(
            payload=payload,
            sig_header=stripe_signature,
            secret=settings.stripe_webhook_secret,
        )
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    if event["type"] != "checkout.session.completed":
        return

    event_object = event["data"]["object"]
    booking_id = event_object.get("metadata", {}).get("booking_id")
    if not booking_id:
        return

    booking = session.get(Booking, int(booking_id))
    if not booking:
        return

    booking.payment_status = PaymentStatus.PAID
    booking.status = BookingStatus.CONFIRMED
    session.add(booking)
    session.commit()
