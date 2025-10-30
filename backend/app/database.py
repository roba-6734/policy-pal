"""
Database configuration and models for PolicyPal.
Handles PostgreSQL connection and SQLAlchemy models.
"""

import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import create_engine, Column, String, DateTime, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from app.config import settings

# Database engine and session
# Use different configurations for SQLite vs PostgreSQL
if settings.database_url.startswith("sqlite"):
    engine = create_engine(
        settings.database_url,
        poolclass=StaticPool,
        connect_args={"check_same_thread": False},
        echo=False
    )
else:
    # Use default QueuePool for Postgres with health checks
    engine = create_engine(
        settings.database_url,
        pool_pre_ping=True,
        pool_recycle=300,
        echo=False
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


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


def get_summary_by_id(                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  db: Session, summary_id: str) -> Optional[PolicySummary]:
    """Retrieve a policy summary by ID."""
    try:
        # Ensure UUID comparison uses proper type
        uid = uuid.UUID(str(summary_id))
        return db.query(PolicySummary).filter(PolicySummary.id == uid).first()
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
