from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, field_validator


class ReminderCreate(BaseModel):
    """Request body for creating a reminder."""
    task_id: UUID
    remind_at: datetime
    channel: Literal["push", "email", "in-app"] = "in-app"

    @field_validator("remind_at")
    @classmethod
    def remind_must_be_future(cls, v: datetime) -> datetime:
        from datetime import timezone
        now = datetime.now(timezone.utc)
        if v.tzinfo is None:
            # If naive, assume UTC
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
    created_at: datetime
