from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from app.models.gamification import GamificationResponse
from app.models.reminder import ReminderResponse
from app.models.task import TaskResponse


class ReminderActivity(BaseModel):
    """A single automation event for the activity feed."""
    event_type: str  # "reminder_sent", "reminder_failed", "overdue_detected", "auto_reminder_created"
    message: str
    timestamp: datetime
    task_id: Optional[UUID] = None


class BriefingResponse(BaseModel):
    """Deterministic daily briefing assembled from current task data."""

    briefing_date: date
    greeting: str
    headline: str
    insight: str
    overdue: list[TaskResponse]
    today: list[TaskResponse]
    upcoming: list[TaskResponse]
    gamification: GamificationResponse | None = None
    upcoming_reminders: list[ReminderResponse] = []
    recent_activity: list[ReminderActivity] = []
