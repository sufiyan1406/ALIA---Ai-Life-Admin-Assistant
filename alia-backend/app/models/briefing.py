from datetime import date

from pydantic import BaseModel

from app.models.gamification import GamificationResponse
from app.models.task import TaskResponse


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
