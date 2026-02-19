from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, and_, select

from app.api.auth import get_current_user
from app.db.session import get_session
from app.models import Booking, BookingStatus, Court, User, UserRole
from app.schemas import CourtCreate, CourtResponse, CourtUpdate

router = APIRouter()


async def require_admin_or_manager(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to require admin or manager role."""
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin or manager privileges required",
        )
    return current_user


@router.post("/", response_model=CourtResponse, status_code=status.HTTP_201_CREATED)
async def create_court(
    court_data: CourtCreate,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin_or_manager),
) -> Court:
    """Create a new court."""
    court = Court(**court_data.model_dump())
    session.add(court)
    session.commit()
    session.refresh(court)
    return court


@router.get("/", response_model=list[CourtResponse])
async def list_courts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    active_only: bool = Query(True),
    session: Session = Depends(get_session),
) -> list[Court]:
    """List all courts."""
    statement = select(Court)
    if active_only:
        statement = statement.where(Court.is_active.is_(True))
    statement = statement.offset(skip).limit(limit)
    courts = session.exec(statement).all()
    return list(courts)


@router.get("/{court_id}", response_model=CourtResponse)
async def get_court(
    court_id: int,
    session: Session = Depends(get_session),
) -> Court:
    """Get court by ID."""
    court = session.get(Court, court_id)
    if not court:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Court not found",
        )
    return court


@router.get("/{court_id}/availability")
async def get_court_availability(
    court_id: int,
    date_value: date = Query(..., alias="date"),
    session: Session = Depends(get_session),
) -> dict[str, object]:
    """Get occupied and free one-hour slots for a specific court and date."""
    court = session.get(Court, court_id)
    if not court or not court.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Court not found or inactive",
        )

    day_start = datetime.combine(date_value, time.min)
    day_end = day_start + timedelta(days=1)

    statement = select(Booking).where(
        and_(
            Booking.court_id == court_id,
            Booking.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED]),
            Booking.start_time < day_end,
            Booking.end_time > day_start,
        )
    )

    bookings = session.exec(statement).all()

    occupied_hours: list[str] = []
    free_hours: list[str] = []

    for hour in range(24):
        slot_start = day_start + timedelta(hours=hour)
        slot_end = slot_start + timedelta(hours=1)
        slot_label = f"{slot_start.strftime('%H:%M')}-{slot_end.strftime('%H:%M')}"

        is_occupied = any(
            booking.start_time < slot_end and booking.end_time > slot_start for booking in bookings
        )

        if is_occupied:
            occupied_hours.append(slot_label)
        else:
            free_hours.append(slot_label)

    return {
        "court_id": court_id,
        "date": date_value.isoformat(),
        "occupied_hours": occupied_hours,
        "free_hours": free_hours,
    }


@router.patch("/{court_id}", response_model=CourtResponse)
async def update_court(
    court_id: int,
    court_data: CourtUpdate,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin_or_manager),
) -> Court:
    """Update court information."""
    court = session.get(Court, court_id)
    if not court:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Court not found",
        )

    # Update court fields
    update_data = court_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(court, key, value)

    session.add(court)
    session.commit()
    session.refresh(court)
    return court


@router.delete("/{court_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_court(
    court_id: int,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin_or_manager),
) -> None:
    """Soft delete a court (set is_active to False)."""
    court = session.get(Court, court_id)
    if not court:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Court not found",
        )

    court.is_active = False
    session.add(court)
    session.commit()
