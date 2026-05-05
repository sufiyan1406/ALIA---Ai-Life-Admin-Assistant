from fastapi import APIRouter, Depends

from app.dependencies import CurrentUser, get_current_user
from app.models.gamification import GamificationResponse
from app.services.gamification import get_or_create_gamification

router = APIRouter(prefix="/gamification", tags=["gamification"])


@router.get("/me", response_model=GamificationResponse)
async def get_my_gamification(current_user: CurrentUser = Depends(get_current_user)):
    """Return the current user's XP, level, streak, badges, and missions."""
    return GamificationResponse(**get_or_create_gamification(str(current_user.id)))
