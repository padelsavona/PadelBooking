from datetime import datetime
from enum import Enum
from typing import Optional

from sqlmodel import Field, Relationship, SQLModel


class UserRole(str, Enum):
    """User role enumeration for RBAC."""

    ADMIN = "admin"
    USER = "user"
    MANAGER = "manager"


class User(SQLModel, table=True):
    """User model for authentication and authorization."""

    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True, max_length=255)
    hashed_password: str = Field(max_length=255)
    full_name: str = Field(max_length=255)
    role: UserRole = Field(default=UserRole.USER)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    bookings: list["Booking"] = Relationship(back_populates="user")


class Court(SQLModel, table=True):
    """Padel court model."""

    __tablename__ = "courts"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100, index=True)
    description: Optional[str] = Field(default=None, max_length=500)
    is_active: bool = Field(default=True)
    hourly_rate: float = Field(default=0.0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    bookings: list["Booking"] = Relationship(back_populates="court")


class BookingStatus(str, Enum):
    """Booking status enumeration."""

    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class PaymentStatus(str, Enum):
    """Payment status for bookings."""

    PENDING = "pending"
    PAID = "paid"
    WAIVED = "waived"


class Booking(SQLModel, table=True):
    """Booking model for court reservations."""

    __tablename__ = "bookings"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    court_id: int = Field(foreign_key="courts.id", index=True)
    start_time: datetime = Field(index=True)
    end_time: datetime = Field(index=True)
    status: BookingStatus = Field(default=BookingStatus.PENDING)
    payment_status: PaymentStatus = Field(default=PaymentStatus.PENDING)
    is_blocked: bool = Field(default=False)
    stripe_session_id: Optional[str] = Field(default=None, max_length=255)
    total_price: float = Field(default=0.0)
    notes: Optional[str] = Field(default=None, max_length=500)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: Optional[User] = Relationship(back_populates="bookings")
    court: Optional[Court] = Relationship(back_populates="bookings")
