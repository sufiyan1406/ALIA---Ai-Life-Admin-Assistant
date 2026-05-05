from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import CurrentUser, get_current_user
from app.models.user import UserResponse
from app.services.supabase import supabase

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=UserResponse)
async def get_auth_me(current_user: CurrentUser = Depends(get_current_user)):
    """Return the authenticated user's profile from public.users."""
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
