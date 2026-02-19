from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, and_, or_, select

from app.api.auth import get_current_user
from app.db.session import get_session
from app.models import Booking, BookingStatus, Court, User, UserRole
from app.schemas import BookingCreate, BookingResponse, BookingUpdate

router = APIRouter()


async def require_admin_or_manager(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to require admin or manager role."""
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin or manager privileges required",
        )
    return current_user


def check_court_availability(
    session: Session, court_id: int, start_time: datetime, end_time: datetime, exclude_booking_id: int | None = None
) -> bool:
    """Check if a court is available for the given time slot."""
    statement = select(Booking).where(
        and_(
            Booking.court_id == court_id,
            Booking.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED]),
            or_(
                # New booking starts during existing booking
                and_(Booking.start_time <= start_time, Booking.end_time > start_time),
                # New booking ends during existing booking
                and_(Booking.start_time < end_time, Booking.end_time >= end_time),
                # New booking encompasses existing booking
                and_(Booking.start_time >= start_time, Booking.end_time <= end_time),
            ),
        )
    )

    if exclude_booking_id is not None:
        statement = statement.where(Booking.id != exclude_booking_id)

    conflicts = session.exec(statement).first()
    return conflicts is None


@router.post("/", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(
    booking_data: BookingCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Booking:
    """Create a new booking."""
    # Validate court exists and is active
    court = session.get(Court, booking_data.court_id)
    if not court or not court.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Court not found or inactive",
        )

    # Validate booking time is in the future
    if booking_data.start_time < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot book in the past",
        )

    # Check court availability
    if not check_court_availability(
        session, booking_data.court_id, booking_data.start_time, booking_data.end_time
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Court is not available for the selected time slot",
        )

    # Calculate total price based on hourly rate
    duration_hours = (booking_data.end_time - booking_data.start_time).total_seconds() / 3600
    total_price = court.hourly_rate * duration_hours

    # Create booking
    booking = Booking(
        **booking_data.model_dump(),
        user_id=current_user.id,
        total_price=total_price,
        status=BookingStatus.PENDING,
    )
    session.add(booking)
    session.commit()
    session.refresh(booking)
    return booking


@router.get("/", response_model=list[BookingResponse])
async def list_bookings(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status_filter: BookingStatus | None = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> list[Booking]:
    """List bookings. Users see their own, admins/managers see all."""
    statement = select(Booking)

    # Users can only see their own bookings
    if current_user.role == UserRole.USER:
        statement = statement.where(Booking.user_id == current_user.id)

    # Apply status filter
    if status_filter:
        statement = statement.where(Booking.status == status_filter)

    statement = statement.offset(skip).limit(limit).order_by(Booking.start_time.desc())
    bookings = session.exec(statement).all()
    return list(bookings)


@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking(
    booking_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Booking:
    """Get booking by ID."""
    booking = session.get(Booking, booking_id)
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )

    # Check authorization
    if current_user.role == UserRole.USER and booking.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this booking",
        )

    return booking


@router.patch("/{booking_id}", response_model=BookingResponse)
async def update_booking(
    booking_id: int,
    booking_data: BookingUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Booking:
    """Update a booking."""
    booking = session.get(Booking, booking_id)
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )

    # Check authorization
    is_owner = booking.user_id == current_user.id
    is_admin_or_manager = current_user.role in [UserRole.ADMIN, UserRole.MANAGER]

    if not is_owner and not is_admin_or_manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this booking",
        )

    # Only admins/managers can change status
    if booking_data.status is not None and not is_admin_or_manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins/managers can change booking status",
        )

    # If updating time, check availability
    new_start = booking_data.start_time or booking.start_time
    new_end = booking_data.end_time or booking.end_time

    if (booking_data.start_time or booking_data.end_time) and not check_court_availability(
        session, booking.court_id, new_start, new_end, exclude_booking_id=booking_id
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Court is not available for the selected time slot",
        )

    # Update booking fields
    update_data = booking_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(booking, key, value)

    session.add(booking)
    session.commit()
    session.refresh(booking)
    return booking


@router.delete("/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_booking(
    booking_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> None:
    """Cancel a booking."""
    booking = session.get(Booking, booking_id)
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )

    # Check authorization
    is_owner = booking.user_id == current_user.id
    is_admin_or_manager = current_user.role in [UserRole.ADMIN, UserRole.MANAGER]

    if not is_owner and not is_admin_or_manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to cancel this booking",
        )

    booking.status = BookingStatus.CANCELLED
    session.add(booking)
    session.commit()
