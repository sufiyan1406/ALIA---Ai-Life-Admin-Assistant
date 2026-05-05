import uuid as uuid_mod
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status

from app.dependencies import CurrentUser, get_current_user
from app.models.file import FileResponse, FileUploadResponse
from app.services.supabase import supabase

router = APIRouter(prefix="/files", tags=["files"])

# Allowed MIME types and their mapped file_type values
ALLOWED_TYPES: dict[str, str] = {
    "image/jpeg": "image",
    "image/png": "image",
    "image/webp": "image",
    "image/gif": "image",
    "application/pdf": "pdf",
    "audio/mpeg": "audio",
    "audio/mp4": "audio",
    "audio/wav": "audio",
    "audio/webm": "audio",
    "audio/ogg": "audio",
    "text/plain": "text",
    "text/csv": "text",
    "text/markdown": "text",
}

MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB


@router.post("/upload", response_model=FileUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile,
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Upload a file to Supabase Storage and record metadata in the files table.
    Validates file type and size. Does NOT trigger any AI processing.
    """
    # Validate content type
    content_type = file.content_type or ""
    file_type = ALLOWED_TYPES.get(content_type)

    if not file_type:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error": True,
                "message": f"Unsupported file type: {content_type}. Allowed: image, pdf, audio, text",
                "code": "VALIDATION_ERROR",
            },
        )

    # Read file content and validate size
    content = await file.read()

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error": True,
                "message": f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB",
                "code": "VALIDATION_ERROR",
            },
        )

    # Generate storage path: {user_id}/{uuid}.{ext}
    extension = (file.filename or "file").rsplit(".", 1)[-1] if file.filename and "." in file.filename else "bin"
    file_uuid = uuid_mod.uuid4()
    storage_path = f"{current_user.id}/{file_uuid}.{extension}"

    # Upload to Supabase Storage
    try:
        supabase.storage.from_("alia-files").upload(
            path=storage_path,
            file=content,
            file_options={"content-type": content_type},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": True, "message": f"Storage upload failed: {str(e)}", "code": "INTERNAL_ERROR"},
        )

    # Build the public URL
    storage_url = f"{supabase.storage_url}/object/alia-files/{storage_path}"

    # Insert record into files table
    result = (
        supabase.table("files")
        .insert({
            "user_id": str(current_user.id),
            "file_type": file_type,
            "storage_url": storage_url,
            "original_filename": file.filename,
            "mime_type": content_type,
            "size_bytes": len(content),
            "storage_path": storage_path,
            "processing_status": "uploaded",
        })
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": True, "message": "Failed to record file metadata", "code": "INTERNAL_ERROR"},
        )

    row = result.data[0]
    return FileUploadResponse(file_id=row["id"], storage_url=row["storage_url"], file_type=row["file_type"])


@router.get("", response_model=list[FileResponse])
async def list_files(
    current_user: CurrentUser = Depends(get_current_user),
):
    """List all files uploaded by the current user."""
    result = (
        supabase.table("files")
        .select("*")
        .eq("user_id", str(current_user.id))
        .order("created_at", desc=True)
        .execute()
    )

    return [FileResponse(**f) for f in (result.data or [])]


@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(
    file_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Delete a file from storage AND the files table."""
    # Fetch the file record first to get storage_url
    file_result = (
        supabase.table("files")
        .select("*")
        .eq("id", str(file_id))
        .eq("user_id", str(current_user.id))
        .single()
        .execute()
    )

    if not file_result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": True, "message": "File not found", "code": "NOT_FOUND"},
        )

    # Extract the storage path from the URL
    storage_url: str = file_result.data["storage_url"]
    # URL format: .../object/alia-files/{user_id}/{filename}
    path_marker = "/object/alia-files/"
    if path_marker in storage_url:
        storage_path = storage_url.split(path_marker, 1)[1]
        try:
            supabase.storage.from_("alia-files").remove([storage_path])
        except Exception:
            pass  # Best-effort storage deletion; DB record still gets removed

    # Delete from files table
    supabase.table("files").delete().eq("id", str(file_id)).eq("user_id", str(current_user.id)).execute()
