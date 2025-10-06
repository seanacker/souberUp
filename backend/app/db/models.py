# app/db/models.py
from datetime import datetime, date
from sqlalchemy import Boolean, String, Integer, Date, Enum, ForeignKey, UniqueConstraint, CheckConstraint, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
import enum
import uuid

class Base(DeclarativeBase): pass

class ConnectionStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    blocked = "blocked"

class User(Base):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String, nullable=False)
    phone_number: Mapped[str] = mapped_column(String, nullable=False, unique=True)  # store E.164
    usage_goal_minutes: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    created_at: Mapped[datetime] = mapped_column(server_default=text("now()"))
    updated_at: Mapped[datetime] = mapped_column(server_default=text("now()"))

    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

class Connection(Base):
    __tablename__ = "connections"
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    other_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    status: Mapped[ConnectionStatus] = mapped_column(Enum(ConnectionStatus), nullable=False)

    __table_args__ = (
        CheckConstraint("user_id <> other_user_id", name="ck_no_self_connect"),
    )

class UsageDaily(Base):
    __tablename__ = "usage_daily"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    total_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    __table_args__ = (UniqueConstraint("user_id", "date", name="uq_user_day"),)
