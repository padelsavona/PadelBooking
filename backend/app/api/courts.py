from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from app.api.auth import get_current_user
from app.db.session import get_session
from app.models import Court, User, UserRole
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
