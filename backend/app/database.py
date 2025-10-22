"""Database configuration and ORM models for PolicyPal."""

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Column, DateTime, JSON, String, Text, create_engine
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.config import settings

# Database engine and session
engine = create_engine(
    settings.database_url,
    poolclass=StaticPool,
    pool_pre_ping=True,
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    """SQLAlchemy model representing an authenticated user."""

    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )


class PolicySummary(Base):
    """SQLAlchemy model for storing policy summaries."""

    __tablename__ = "policy_summaries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_type = Column(String(10), nullable=False)  # 'pdf' or 'url'
    source_name = Column(Text, nullable=False)
    source_url = Column(Text, nullable=True)  # For URL sources
    summary_data = Column(JSON, nullable=False)  # Store full structured summary
    file_hash = Column(String(64), nullable=True)  # For deduplication
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


def get_db() -> Session:
    """Dependency to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Create all database tables."""
    Base.metadata.create_all(bind=engine)


def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
    """Retrieve a user by their ID."""
    try:
        user_uuid = uuid.UUID(str(user_id))
    except (TypeError, ValueError):
        return None

    try:
        return db.query(User).filter(User.id == user_uuid).first()
    except Exception:
        return None


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Retrieve a user by email."""
    try:
        return db.query(User).filter(User.email == email).first()
    except Exception:
        return None


def create_user(db: Session, email: str, hashed_password: str) -> User:
    """Persist a new user to the database."""
    user = User(email=email, hashed_password=hashed_password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_summary_by_id(db: Session, summary_id: str) -> Optional[PolicySummary]:
    """Retrieve a policy summary by ID."""
    try:
        return db.query(PolicySummary).filter(PolicySummary.id == summary_id).first()
    except Exception:
        return None


def save_summary(
    db: Session,
    source_type: str,
    source_name: str,
    source_url: Optional[str],
    summary_data: dict,
    file_hash: Optional[str] = None
) -> PolicySummary:
    """Save a new policy summary to the database."""
    summary = PolicySummary(
        source_type=source_type,
        source_name=source_name,
        source_url=source_url,
        summary_data=summary_data,
        file_hash=file_hash
    )
    db.add(summary)
    db.commit()
    db.refresh(summary)
    return summary
