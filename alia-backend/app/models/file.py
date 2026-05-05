from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class FileUploadResponse(BaseModel):
    """Response after a successful file upload."""
    file_id: UUID
    storage_url: str
    file_type: str


class FileResponse(BaseModel):
    """File metadata returned to the client."""
    id: UUID
    user_id: UUID
    file_type: str
    storage_url: str
    original_filename: Optional[str] = None
    mime_type: Optional[str] = None
    size_bytes: Optional[int] = None
    storage_path: Optional[str] = None
    processing_status: str = "processed"
    source_task_count: int = 0
    raw_text: Optional[str] = None
    processed_at: Optional[datetime] = None
    created_at: datetime
