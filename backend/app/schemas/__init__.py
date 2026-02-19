from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models import BookingStatus, PaymentStatus, UserRole


# User Schemas
class UserBase(BaseModel):
    """Base user schema."""

    email: EmailStr
    full_name: str = Field(min_length=1, max_length=255)


class UserCreate(UserBase):
    """Schema for user creation."""

    password: str = Field(min_length=8, max_length=100)

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength."""
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class UserUpdate(BaseModel):
    """Schema for user update."""

    full_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    """Schema for user response."""

    id: int
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Court Schemas
class CourtBase(BaseModel):
    """Base court schema."""

    name: str = Field(min_length=1, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)
    hourly_rate: float = Field(ge=0)


class CourtCreate(CourtBase):
    """Schema for court creation."""

    pass


class CourtUpdate(BaseModel):
    """Schema for court update."""

    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)
    hourly_rate: Optional[float] = Field(default=None, ge=0)
    is_active: Optional[bool] = None


class CourtResponse(CourtBase):
    """Schema for court response."""

    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Booking Schemas
class BookingBase(BaseModel):
    """Base booking schema."""

    court_id: int = Field(gt=0)
    start_time: datetime
    end_time: datetime
    notes: Optional[str] = Field(default=None, max_length=500)

    @field_validator("end_time")
    @classmethod
    def validate_end_time(cls, v: datetime, info: dict) -> datetime:
        """Validate that end_time is after start_time."""
        if "start_time" in info.data and v <= info.data["start_time"]:
            raise ValueError("end_time must be after start_time")
        return v

    @field_validator("start_time", "end_time")
    @classmethod
    def validate_booking_boundaries(cls, v: datetime) -> datetime:
        """Validate booking boundaries in 00:00-24:00 range."""
        if v.minute % 30 != 0 or v.second != 0 or v.microsecond != 0:
            raise ValueError("Booking times must be on 30-minute slots")
        return v


class BookingCreate(BookingBase):
    """Schema for booking creation."""

    pass


class BookingUpdate(BaseModel):
    """Schema for booking update."""

    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[BookingStatus] = None
    notes: Optional[str] = Field(default=None, max_length=500)


class BookingResponse(BookingBase):
    """Schema for booking response."""

    id: int
    user_id: int
    status: BookingStatus
    payment_status: PaymentStatus
    is_blocked: bool
    stripe_session_id: Optional[str] = None
    total_price: float
    created_at: datetime

    class Config:
        from_attributes = True


# Auth Schemas
class Token(BaseModel):
    """Token response schema."""

    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token payload data schema."""

    user_id: int
    email: str
    role: UserRole


class CheckoutRequest(BaseModel):
    """Create Stripe checkout session request."""

    booking_id: int


class CheckoutResponse(BaseModel):
    """Create Stripe checkout session response."""

    checkout_url: str


class AdminBlockRequest(BaseModel):
    """Admin request to block a court timeslot."""

    court_id: int = Field(gt=0)
    start_time: datetime
    end_time: datetime
    notes: Optional[str] = Field(default=None, max_length=500)


# Error Response
class ErrorResponse(BaseModel):
    """Standardized error response."""

    code: str
    message: str
    details: Optional[dict] = None
    trace_id: Optional[str] = None
