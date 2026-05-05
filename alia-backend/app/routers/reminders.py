from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import CurrentUser, get_current_user
from app.models.reminder import ReminderCreate, ReminderResponse
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

    result = supabase.table("reminders").insert(reminder_data).execute()

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": True, "message": "Failed to create reminder", "code": "INTERNAL_ERROR"},
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
