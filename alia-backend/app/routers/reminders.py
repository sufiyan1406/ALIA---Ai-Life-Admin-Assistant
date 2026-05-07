from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import CurrentUser, get_current_user
from app.models.reminder import ReminderCreate, ReminderResponse, ReminderUpdate
from app.services.supabase import supabase

router = APIRouter(prefix="/reminders", tags=["reminders"])


@router.get("", response_model=list[ReminderResponse])
async def list_reminders(
    current_user: CurrentUser = Depends(get_current_user),
):
    """List all reminders for the current user."""
    result = (
        supabase.table("reminders")
        .select("*")
        .eq("user_id", str(current_user.id))
        .order("remind_at")
        .execute()
    )

    return [ReminderResponse(**r) for r in (result.data or [])]


@router.get("/active", response_model=list[ReminderResponse])
async def list_active_reminders(
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get pending reminders + recently sent (last 24h) for in-app display."""
    now = datetime.now(timezone.utc)
    cutoff = (now - __import__("datetime").timedelta(hours=24)).isoformat()

    # Pending reminders
    pending_result = (
        supabase.table("reminders")
        .select("*")
        .eq("user_id", str(current_user.id))
        .eq("status", "pending")
        .order("remind_at")
        .execute()
    )

    # Recently sent (last 24h)
    sent_result = (
        supabase.table("reminders")
        .select("*")
        .eq("user_id", str(current_user.id))
        .eq("status", "sent")
        .gte("sent_at", cutoff)
        .order("sent_at", desc=True)
        .limit(20)
        .execute()
    )

    all_reminders = (pending_result.data or []) + (sent_result.data or [])
    return [ReminderResponse(**r) for r in all_reminders]


@router.post("", response_model=ReminderResponse, status_code=status.HTTP_201_CREATED)
async def create_reminder(
    body: ReminderCreate,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Create a new reminder. The referenced task must belong to the current user."""
    # Verify the task belongs to the current user
    task_check = (
        supabase.table("tasks")
        .select("id")
        .eq("id", str(body.task_id))
        .eq("user_id", str(current_user.id))
        .single()
        .execute()
    )

    if not task_check.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": True, "message": "Task not found", "code": "NOT_FOUND"},
        )

    reminder_data = body.model_dump()
    reminder_data["user_id"] = str(current_user.id)
    reminder_data["task_id"] = str(body.task_id)
    reminder_data["remind_at"] = body.remind_at.isoformat()
    reminder_data["status"] = "pending"
    reminder_data["retry_count"] = 0

    result = supabase.table("reminders").insert(reminder_data).execute()

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": True, "message": "Failed to create reminder", "code": "INTERNAL_ERROR"},
        )

    return ReminderResponse(**result.data[0])


@router.patch("/{reminder_id}", response_model=ReminderResponse)
async def update_reminder(
    reminder_id: UUID,
    body: ReminderUpdate,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Update a reminder's time or channel. Must belong to current user and be pending."""
    # Verify ownership and pending status
    check = (
        supabase.table("reminders")
        .select("*")
        .eq("id", str(reminder_id))
        .eq("user_id", str(current_user.id))
        .single()
        .execute()
    )

    if not check.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": True, "message": "Reminder not found", "code": "NOT_FOUND"},
        )

    if check.data.get("status") != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": True, "message": "Only pending reminders can be edited", "code": "VALIDATION_ERROR"},
        )

    update_data = body.model_dump(exclude_none=True)
    if "remind_at" in update_data:
        update_data["remind_at"] = update_data["remind_at"].isoformat()

    if not update_data:
        return ReminderResponse(**check.data)

    result = (
        supabase.table("reminders")
        .update(update_data)
        .eq("id", str(reminder_id))
        .eq("user_id", str(current_user.id))
        .execute()
    )

    return ReminderResponse(**result.data[0])


@router.post("/{reminder_id}/dismiss", response_model=ReminderResponse)
async def dismiss_reminder(
    reminder_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Dismiss a sent reminder. Must belong to current user."""
    now = datetime.now(timezone.utc).isoformat()

    # Verify ownership
    check = (
        supabase.table("reminders")
        .select("*")
        .eq("id", str(reminder_id))
        .eq("user_id", str(current_user.id))
        .single()
        .execute()
    )

    if not check.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": True, "message": "Reminder not found", "code": "NOT_FOUND"},
        )

    result = (
        supabase.table("reminders")
        .update({"status": "dismissed", "dismissed_at": now})
        .eq("id", str(reminder_id))
        .eq("user_id", str(current_user.id))
        .execute()
    )

    return ReminderResponse(**result.data[0])


@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reminder(
    reminder_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Delete a reminder. Must belong to the current user."""
    result = (
        supabase.table("reminders")
        .delete()
        .eq("id", str(reminder_id))
        .eq("user_id", str(current_user.id))
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": True, "message": "Reminder not found", "code": "NOT_FOUND"},
        )
