from datetime import date
from typing import Any
from uuid import UUID

from pydantic import BaseModel


class GamificationResponse(BaseModel):
    """Gamification state returned to the client."""

    id: UUID
    user_id: UUID
    xp_total: int
    level: int
    level_title: str
    next_level_xp: int | None = None
    xp_to_next_level: int | None = None
    streak_current: int
    streak_longest: int
    streak_last_date: date | None = None
    streak_freezes: int
    badges: list[Any]
    daily_missions: list[Any]
