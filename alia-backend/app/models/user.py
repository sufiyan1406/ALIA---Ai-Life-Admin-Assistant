from datetime import datetime, time
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class UserResponse(BaseModel):
    """Public user profile returned to the client."""
    id: UUID
    email: str
    display_name: Optional[str] = None
    timezone: str
    briefing_time: time
    plan: str
    created_at: datetime


class UserUpdate(BaseModel):
    """Fields allowed to be updated on the user profile."""
    display_name: Optional[str] = Field(None, min_length=1, max_length=100)
    timezone: Optional[str] = Field(None, min_length=1, max_length=50)
    briefing_time: Optional[time] = None
