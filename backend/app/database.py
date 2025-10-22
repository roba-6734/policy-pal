"""
Database configuration and models for PolicyPal.
Handles PostgreSQL connection and SQLAlchemy models.
"""

import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import create_engine, Column, String, DateTime, Text, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from app.config import settings

# Database engine and session
engine = create_engine(
    settings.database_url,
    poolclass=StaticPool,
    pool_pre_ping=True,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class PolicySummary(Base):
    """SQLAlchemy model for storing policy summaries."""

    __tablename__ = "policy_summaries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
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


def get_summary_by_id(
    db: Session,
    summary_id: str,
    *,
    user_id: Optional[uuid.UUID] = None
) -> Optional[PolicySummary]:
    """Retrieve a policy summary by ID."""
    try:
        query = db.query(PolicySummary).filter(PolicySummary.id == summary_id)

        if user_id:
            query = query.filter(PolicySummary.user_id == user_id)

        return query.first()
    except Exception:
        return None


def save_summary(
    db: Session,
    user_id: uuid.UUID,
    source_type: str,
    source_name: str,
    source_url: Optional[str],
    summary_data: dict,
    file_hash: Optional[str] = None
) -> PolicySummary:
    """Save a new policy summary to the database."""
    summary = PolicySummary(
        user_id=user_id,
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


def list_summaries_for_user(
    db: Session,
    user_id: uuid.UUID,
    *,
    limit: int = 20,
    offset: int = 0,
    source_type: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> tuple[list[PolicySummary], int]:
    """Retrieve paginated summaries for a given user."""

    query = db.query(PolicySummary).filter(PolicySummary.user_id == user_id)

    if source_type:
        query = query.filter(PolicySummary.source_type == source_type)

    if start_date:
        query = query.filter(PolicySummary.created_at >= start_date)

    if end_date:
        query = query.filter(PolicySummary.created_at <= end_date)

    total = query.count()

    items = (
        query
        .order_by(PolicySummary.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return items, total
