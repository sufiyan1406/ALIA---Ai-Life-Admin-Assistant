from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, field_validator


ReminderStatus = Literal["pending", "sent", "failed", "dismissed"]
ReminderChannel = Literal["push", "email", "in-app"]


class ReminderCreate(BaseModel):
    """Request body for creating a reminder."""
    task_id: UUID
    remind_at: datetime
    channel: ReminderChannel = "email"

    @field_validator("remind_at")
    @classmethod
    def remind_must_be_future(cls, v: datetime) -> datetime:
        from datetime import timezone, timedelta
        now = datetime.now(timezone.utc)
        if v.tzinfo is None:
            # If naive, assume UTC
            v = v.replace(tzinfo=timezone.utc)
        # Allow a 60-second grace window for near-now times
        if v <= now - timedelta(seconds=60):
            raise ValueError("remind_at must be a future date/time")
        return v


class ReminderUpdate(BaseModel):
    """Request body for updating a reminder."""
    remind_at: Optional[datetime] = None
    channel: Optional[ReminderChannel] = None

    @field_validator("remind_at")
    @classmethod
    def remind_must_be_future_if_set(cls, v: datetime | None) -> datetime | None:
        if v is None:
            return v
        from datetime import timezone
        now = datetime.now(timezone.utc)
        if v.tzinfo is None:
            v = v.replace(tzinfo=timezone.utc)
        if v <= now:
            raise ValueError("remind_at must be a future date/time")
        return v


class ReminderResponse(BaseModel):
    """Reminder data returned to the client."""
    id: UUID
    task_id: UUID
    user_id: UUID
    remind_at: datetime
    channel: str
    sent: bool
    status: str = "pending"
    sent_at: Optional[datetime] = None
    dismissed_at: Optional[datetime] = None
    retry_count: int = 0
    created_at: datetime
