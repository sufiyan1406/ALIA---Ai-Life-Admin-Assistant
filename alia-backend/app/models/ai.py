from datetime import date
from typing import Literal, Optional
from uuid import UUID
from pydantic import BaseModel, Field

class AIExtractedTask(BaseModel):
    """Pydantic model for a single task extracted by the AI."""
    task_name: str = Field(..., min_length=1, max_length=500)
    category: Optional[Literal["Finance", "Health", "Legal", "Home", "Work", "Personal"]] = None
    priority: Literal["Urgent", "High", "Medium", "Low"] = "Medium"
    due_date: Optional[date] = None
    suggested_action: Optional[str] = None
    confidence_score: Optional[float] = None
    needs_review: bool = False
    notes: Optional[str] = None

class AIExtractionResponse(BaseModel):
    """Response returned from the /extract endpoint."""
    tasks: list[AIExtractedTask]
    count: int
    input_type: str
    source_file_id: Optional[UUID] = None
    needs_review_count: int
    pages_truncated: bool = False
    total_pages: Optional[int] = None

class AIConfirmRequest(BaseModel):
    """Request body to confirm and save extracted tasks."""
    tasks: list[AIExtractedTask]
    source_file_id: Optional[UUID] = None
