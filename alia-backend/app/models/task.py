from datetime import date, datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class TaskCreate(BaseModel):
    """Request body for creating a new task."""
    task_name: str = Field(..., min_length=1, max_length=500)
    category: Optional[Literal["Finance", "Health", "Legal", "Home", "Work", "Personal"]] = None
    priority: Literal["Urgent", "High", "Medium", "Low"] = "Medium"
    due_date: Optional[date] = None
    notes: Optional[str] = None
    suggested_action: Optional[str] = None


class TaskUpdate(BaseModel):
    """Request body for updating an existing task."""
    task_name: Optional[str] = Field(None, min_length=1, max_length=500)
    category: Optional[Literal["Finance", "Health", "Legal", "Home", "Work", "Personal"]] = None
    priority: Optional[Literal["Urgent", "High", "Medium", "Low"]] = None
    status: Optional[Literal["pending", "in_progress", "done", "snoozed", "archived"]] = None
    due_date: Optional[date] = None
    notes: Optional[str] = None
    suggested_action: Optional[str] = None
    needs_review: Optional[bool] = None


class TaskResponse(BaseModel):
    """Task data returned to the client."""
    id: UUID
    user_id: UUID
    task_name: str
    category: Optional[str] = None
    priority: str
    status: str
    due_date: Optional[date] = None
    suggested_action: Optional[str] = None
    source_file_id: Optional[UUID] = None
    xp_value: int
    confidence_score: Optional[float] = None
    needs_review: bool
    notes: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None


class TaskSnooze(BaseModel):
    """Request body for snoozing a task."""
    snooze_until: date

    @field_validator("snooze_until")
    @classmethod
    def snooze_must_be_future(cls, v: date) -> date:
        if v <= date.today():
            raise ValueError("snooze_until must be a future date")
        return v


class TaskFilters(BaseModel):
    """Query parameters for listing tasks."""
    status: Optional[Literal["pending", "in_progress", "done", "snoozed", "archived"]] = None
    priority: Optional[Literal["Urgent", "High", "Medium", "Low"]] = None
    category: Optional[Literal["Finance", "Health", "Legal", "Home", "Work", "Personal"]] = None
    due_before: Optional[date] = None
    due_after: Optional[date] = None
    limit: int = Field(50, ge=1, le=200)
    offset: int = Field(0, ge=0)


class TaskSummary(BaseModel):
    """Summary of tasks by various dimensions."""
    by_status: dict[str, int]
    by_priority: dict[str, int]
    by_category: dict[str, int]
    total: int
