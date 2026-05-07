from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import CurrentUser, get_current_user
from app.models.user import UserResponse, UserUpdate
from app.services.supabase import supabase

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_user_profile(current_user: CurrentUser = Depends(get_current_user)):
    """Return the current user's profile."""
    result = (
        supabase.table("users")
        .select("*")
        .eq("id", str(current_user.id))
        .single()
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": True, "message": "User profile not found", "code": "NOT_FOUND"},
        )

    return UserResponse(**result.data)


@router.patch("/me", response_model=UserResponse)
async def update_user_profile(
    body: UserUpdate,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Update profile fields. Cannot update plan or id."""
    update_data = body.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": True, "message": "No fields to update", "code": "VALIDATION_ERROR"},
        )

    # Convert time objects to string for Supabase
    for time_field in ("briefing_time", "quiet_hours_start", "quiet_hours_end"):
        if time_field in update_data and update_data[time_field] is not None:
            update_data[time_field] = update_data[time_field].isoformat()

    result = (
        supabase.table("users")
        .update(update_data)
        .eq("id", str(current_user.id))
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": True, "message": "User profile not found", "code": "NOT_FOUND"},
        )

    return UserResponse(**result.data[0])
