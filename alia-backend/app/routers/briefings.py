from datetime import date, timedelta

from fastapi import APIRouter, Depends

from app.dependencies import CurrentUser, get_current_user
from app.models.briefing import BriefingResponse
from app.models.gamification import GamificationResponse
from app.models.task import TaskResponse
from app.services.gamification import get_or_create_gamification
from app.services.supabase import supabase

router = APIRouter(prefix="/briefings", tags=["briefings"])


@router.get("/today", response_model=BriefingResponse)
async def get_today_briefing(current_user: CurrentUser = Depends(get_current_user)):
    """Build a deterministic briefing from overdue, today, upcoming, and reward data."""
    today = date.today()
    next_three_days = today + timedelta(days=3)

    base = (
        supabase.table("tasks")
        .select("*")
        .eq("user_id", str(current_user.id))
        .not_.in_("status", ["done", "archived"])
    )

    overdue_result = (
        base.lt("due_date", today.isoformat())
        .order("xp_value", desc=True)
        .order("due_date", desc=False)
        .limit(5)
        .execute()
    )

    today_result = (
        supabase.table("tasks")
        .select("*")
        .eq("user_id", str(current_user.id))
        .eq("due_date", today.isoformat())
        .not_.in_("status", ["done", "archived"])
        .order("xp_value", desc=True)
        .limit(8)
        .execute()
    )

    upcoming_result = (
        supabase.table("tasks")
        .select("*")
        .eq("user_id", str(current_user.id))
        .gt("due_date", today.isoformat())
        .lte("due_date", next_three_days.isoformat())
        .not_.in_("status", ["done", "archived"])
        .order("due_date", desc=False)
        .order("xp_value", desc=True)
        .limit(8)
        .execute()
    )

    overdue = [TaskResponse(**task) for task in (overdue_result.data or [])]
    today_tasks = [TaskResponse(**task) for task in (today_result.data or [])]
    upcoming = [TaskResponse(**task) for task in (upcoming_result.data or [])]
    gamification = GamificationResponse(**get_or_create_gamification(str(current_user.id)))

    if overdue:
        headline = f"{len(overdue)} overdue task{'s' if len(overdue) != 1 else ''} need attention first."
        insight = "Clear the oldest overdue item before starting new admin work."
    elif today_tasks:
        headline = f"{len(today_tasks)} task{'s' if len(today_tasks) != 1 else ''} due today."
        insight = "Start with the highest XP item to reduce risk and build momentum."
    elif upcoming:
        headline = f"{len(upcoming)} upcoming task{'s' if len(upcoming) != 1 else ''} in the next 3 days."
        insight = "You have room to get ahead before anything becomes urgent."
    else:
        headline = "No dated tasks need attention today."
        insight = "Capture anything loose before it turns into tomorrow's admin load."

    return BriefingResponse(
        briefing_date=today,
        greeting="Good morning.",
        headline=headline,
        insight=insight,
        overdue=overdue,
        today=today_tasks,
        upcoming=upcoming,
        gamification=gamification,
    )
