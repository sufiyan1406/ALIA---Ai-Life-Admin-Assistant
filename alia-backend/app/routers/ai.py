import os
import tempfile
import uuid
from typing import Optional
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.dependencies import CurrentUser, get_current_user
from app.models.ai import AIExtractedTask, AIExtractionResponse, AIConfirmRequest
from app.services.ai_extraction import (
    extract_from_audio,
    extract_from_docx,
    extract_from_image,
    extract_from_pdf,
    extract_tasks_with_llm,
)
from app.services.supabase import supabase

router = APIRouter(prefix="/ai", tags=["ai"])

IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
PDF_TYPES = {"application/pdf"}
AUDIO_TYPES = {"audio/mpeg", "audio/mp4", "audio/wav", "audio/webm", "audio/ogg", "audio/x-m4a", "audio/m4a", "audio/aac"}
DOCX_TYPES = {"application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
TEXT_TYPES = {"text/plain", "text/csv", "text/markdown"}

MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB for images/pdfs
MAX_AUDIO_SIZE = 25 * 1024 * 1024 # 25MB for audio

def _get_xp_value(priority: str) -> int:
    return {"Urgent": 50, "High": 40, "Medium": 20, "Low": 10}.get(priority, 20)


def _file_type_for_content_type(content_type: str) -> str:
    if content_type in IMAGE_TYPES:
        return "image"
    if content_type in PDF_TYPES:
        return "pdf"
    if content_type in AUDIO_TYPES:
        return "audio"
    if content_type in DOCX_TYPES:
        return "docx"
    return "text"


def _build_storage_url(storage_path: str) -> str:
    return f"{supabase.storage_url}/object/alia-files/{storage_path}"


def _record_processed_file(
    *,
    current_user: CurrentUser,
    content: bytes,
    filename: str | None,
    content_type: str,
    raw_text: str,
) -> Optional[str]:
    """Upload the source file and persist processed metadata for source linking."""
    extension = (filename or "file").rsplit(".", 1)[-1] if filename and "." in filename else "bin"
    storage_path = f"{current_user.id}/{uuid.uuid4()}.{extension}"

    supabase.storage.from_("alia-files").upload(
        path=storage_path,
        file=content,
        file_options={"content-type": content_type},
    )

    result = (
        supabase.table("files")
        .insert({
            "user_id": str(current_user.id),
            "file_type": _file_type_for_content_type(content_type),
            "storage_url": _build_storage_url(storage_path),
            "original_filename": filename,
            "mime_type": content_type,
            "size_bytes": len(content),
            "storage_path": storage_path,
            "processing_status": "processed",
            "raw_text": raw_text,
            "processed_at": datetime.now(timezone.utc).isoformat(),
        })
        .execute()
    )

    if not result.data:
        return None

    return result.data[0]["id"]

@router.post("/extract", response_model=AIExtractionResponse)
async def extract_tasks(
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
    current_user: CurrentUser = Depends(get_current_user),
):
    if not file and not text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": True, "message": "Must provide either a file or text input.", "code": "VALIDATION_ERROR"}
        )
        
    if file and text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": True, "message": "Cannot process both file and text simultaneously.", "code": "VALIDATION_ERROR"}
        )
        
    extracted_text = ""
    input_type = "text"
    pages_truncated = False
    total_pages = None
    source_file_id = None
    source_file_content: bytes | None = None
    source_file_name: str | None = None
    source_content_type = ""
    
    if text:
        extracted_text = text.strip()
    elif file:
        content_type = file.content_type or ""
        
        # Check type
        if content_type in IMAGE_TYPES:
            input_type = "image"
            limit = MAX_FILE_SIZE
        elif content_type in PDF_TYPES:
            input_type = "pdf"
            limit = MAX_FILE_SIZE
        elif content_type in AUDIO_TYPES:
            input_type = "audio"
            limit = MAX_AUDIO_SIZE
        elif content_type in DOCX_TYPES:
            input_type = "docx"
            limit = MAX_FILE_SIZE
        elif content_type in TEXT_TYPES:
            input_type = "text_file"
            limit = MAX_FILE_SIZE
        else:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={"error": True, "message": f"Unsupported file type: {content_type}", "code": "VALIDATION_ERROR"}
            )
            
        content = await file.read()
        if len(content) > limit:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={"error": True, "message": f"File too large. Maximum size is {limit // (1024*1024)}MB for {input_type}.", "code": "VALIDATION_ERROR"}
            )
        source_file_content = content
        source_file_name = file.filename
        source_content_type = content_type
            
        # Create a temp file
        temp_fd, temp_path = tempfile.mkstemp(suffix=f".{file.filename.split('.')[-1] if file.filename else 'tmp'}")
        try:
            with os.fdopen(temp_fd, "wb") as f:
                f.write(content)
                
            if input_type == "image":
                extracted_text = await extract_from_image(temp_path)
            elif input_type == "pdf":
                extracted_text, pages_truncated, total_pages = await extract_from_pdf(temp_path)
            elif input_type == "audio":
                try:
                    extracted_text = await extract_from_audio(temp_path)
                except Exception as e:
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail={"error": True, "message": f"Audio transcription failed: {str(e)}", "code": "SERVICE_ERROR"}
                    )
            elif input_type == "docx":
                extracted_text = await extract_from_docx(temp_path)
            elif input_type == "text_file":
                extracted_text = content.decode("utf-8", errors="ignore").strip()
                
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={"error": True, "message": f"Preprocessing failed: {str(e)}", "code": "INTERNAL_ERROR"}
            )
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

        try:
            source_file_id = _record_processed_file(
                current_user=current_user,
                content=source_file_content,
                filename=source_file_name,
                content_type=source_content_type,
                raw_text=extracted_text,
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={"error": True, "message": f"Source file storage failed: {str(e)}", "code": "INTERNAL_ERROR"}
            )
                
    if not extracted_text:
        return AIExtractionResponse(
            tasks=[],
            count=0,
            input_type=input_type,
            source_file_id=source_file_id,
            needs_review_count=0,
            pages_truncated=pages_truncated,
            total_pages=total_pages,
        )
        
    try:
        tasks = await extract_tasks_with_llm(extracted_text)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": True, "message": str(e), "code": "VALIDATION_ERROR"}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"error": True, "message": f"AI Extraction failed: {str(e)}", "code": "SERVICE_ERROR"}
        )
        
    needs_review_count = sum(1 for t in tasks if t.needs_review)
    
    return AIExtractionResponse(
        tasks=tasks,
        count=len(tasks),
        input_type=input_type,
        source_file_id=source_file_id,
        needs_review_count=needs_review_count,
        pages_truncated=pages_truncated,
        total_pages=total_pages
    )

@router.post("/confirm", response_model=list[dict])
async def confirm_tasks(
    request: AIConfirmRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    if not request.tasks:
        return []

    source_file_id = str(request.source_file_id) if request.source_file_id else None
    if source_file_id:
        source_file = (
            supabase.table("files")
            .select("id")
            .eq("id", source_file_id)
            .eq("user_id", str(current_user.id))
            .execute()
        )
        if not source_file.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"error": True, "message": "Source file not found", "code": "NOT_FOUND"}
            )
        
    # Check for duplicates in the last 60 seconds
    one_minute_ago = (datetime.utcnow() - timedelta(seconds=60)).isoformat()
    
    recent_tasks_result = (
        supabase.table("tasks")
        .select("task_name")
        .eq("user_id", str(current_user.id))
        .gte("created_at", one_minute_ago)
        .execute()
    )
    
    recent_task_names = {t["task_name"] for t in (recent_tasks_result.data or [])}
    
    tasks_to_insert = []
    for t in request.tasks:
        if t.task_name in recent_task_names:
            continue
            
        task_dict = t.model_dump(exclude_none=True)
        task_dict["user_id"] = str(current_user.id)
        task_dict["status"] = "pending"
        task_dict["xp_value"] = _get_xp_value(t.priority)
        if source_file_id:
            task_dict["source_file_id"] = source_file_id
        if task_dict.get("due_date"):
            task_dict["due_date"] = task_dict["due_date"].isoformat()
        
        # Add to recent set to prevent duplicate inserts in the same payload
        recent_task_names.add(t.task_name)
        tasks_to_insert.append(task_dict)
        
    if not tasks_to_insert:
        return []
        
    result = (
        supabase.table("tasks")
        .insert(tasks_to_insert)
        .execute()
    )

    if source_file_id:
        supabase.table("files").update({
            "source_task_count": len(result.data or []),
            "processing_status": "processed",
        }).eq("id", source_file_id).eq("user_id", str(current_user.id)).execute()

    return result.data or []
