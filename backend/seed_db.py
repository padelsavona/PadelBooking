#!/usr/bin/env python3
"""Seed the database with initial data."""
import asyncio
from datetime import datetime

from sqlmodel import Session, create_engine, select

from app.core.config import settings
from app.core.security import get_password_hash
from app.models import Court, User, UserRole


def seed_database():
    """Seed the database with initial data."""
    engine = create_engine(settings.database_url, echo=True)

    with Session(engine) as session:
        # Check if admin user already exists
        statement = select(User).where(User.email == "admin@padelbooking.com")
        existing_admin = session.exec(statement).first()

        if not existing_admin:
            # Create admin user
            admin = User(
                email="admin@padelbooking.com",
                full_name="Admin User",
                hashed_password=get_password_hash("Admin123!"),
                role=UserRole.ADMIN,
            )
            session.add(admin)
            print("✓ Created admin user: admin@padelbooking.com / Admin123!")

        # Check if courts already exist
        statement = select(Court)
        existing_courts = session.exec(statement).all()

        if not existing_courts:
            # Create sample courts
            courts = [
                Court(
                    name="Court 1 - Premium",
                    description="Premium indoor court with professional lighting",
                    hourly_rate=30.0,
                    is_active=True,
                ),
                Court(
                    name="Court 2 - Standard",
                    description="Standard outdoor court",
                    hourly_rate=20.0,
                    is_active=True,
                ),
                Court(
                    name="Court 3 - Training",
                    description="Training court with wall practice area",
                    hourly_rate=15.0,
                    is_active=True,
                ),
            ]
            for court in courts:
                session.add(court)
            print(f"✓ Created {len(courts)} courts")

        session.commit()
        print("\n✓ Database seeded successfully!")
        print("\nLogin credentials:")
        print("  Email: admin@padelbooking.com")
        print("  Password: Admin123!")


if __name__ == "__main__":
    seed_database()
