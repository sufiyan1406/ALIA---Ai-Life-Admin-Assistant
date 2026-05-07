from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends

from app.dependencies import CurrentUser, get_current_user
from app.models.briefing import BriefingResponse, ReminderActivity
from app.models.gamification import GamificationResponse
from app.models.reminder import ReminderResponse
from app.models.task import TaskResponse
from app.services.gamification import get_or_create_gamification
from app.services.supabase import supabase

router = APIRouter(prefix="/briefings", tags=["briefings"])


@router.get("/today", response_model=BriefingResponse)
async def get_today_briefing(current_user: CurrentUser = Depends(get_current_user)):
    """Build a deterministic briefing from overdue, today, upcoming, reminders, and reward data."""
    today = date.today()
    next_three_days = today + timedelta(days=3)
    now = datetime.now(timezone.utc)
    uid = str(current_user.id)

    base = (
        supabase.table("tasks")
        .select("*")
        .eq("user_id", uid)
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
        .eq("user_id", uid)
        .eq("due_date", today.isoformat())
        .not_.in_("status", ["done", "archived"])
        .order("xp_value", desc=True)
        .limit(8)
        .execute()
    )

    upcoming_result = (
        supabase.table("tasks")
        .select("*")
        .eq("user_id", uid)
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
    gamification = GamificationResponse(**get_or_create_gamification(uid))

    # ── Upcoming reminders (next 24h, pending) ──
    reminder_cutoff = (now + timedelta(hours=24)).isoformat()
    upcoming_reminders_result = (
        supabase.table("reminders")
        .select("*")
        .eq("user_id", uid)
        .eq("status", "pending")
        .lte("remind_at", reminder_cutoff)
        .order("remind_at")
        .limit(10)
        .execute()
    )
    upcoming_reminders = [ReminderResponse(**r) for r in (upcoming_reminders_result.data or [])]

    # ── Recent activity (last 6h: sent + failed reminders) ──
    activity_cutoff = (now - timedelta(hours=6)).isoformat()
    recent_sent_result = (
        supabase.table("reminders")
        .select("*, tasks(task_name)")
        .eq("user_id", uid)
        .in_("status", ["sent", "failed"])
        .gte("sent_at", activity_cutoff)
        .order("sent_at", desc=True)
        .limit(10)
        .execute()
    )

    recent_activity: list[ReminderActivity] = []
    for r in (recent_sent_result.data or []):
        task_name = r.get("tasks", {}).get("task_name", "Unknown task") if r.get("tasks") else "Unknown task"
        if r["status"] == "sent":
            event_type = "reminder_sent"
            message = f"Reminder delivered for \"{task_name}\""
        else:
            event_type = "reminder_failed"
            message = f"Reminder delivery failed for \"{task_name}\""

        recent_activity.append(ReminderActivity(
            event_type=event_type,
            message=message,
            timestamp=r.get("sent_at") or r.get("created_at"),
            task_id=r.get("task_id"),
        ))

    # Add overdue detection events
    for task in overdue:
        recent_activity.append(ReminderActivity(
            event_type="overdue_detected",
            message=f"Overdue: \"{task.task_name}\" was due {task.due_date}",
            timestamp=now,
            task_id=task.id,
        ))

    # Sort activity by timestamp descending
    recent_activity.sort(key=lambda a: a.timestamp, reverse=True)

    # ── Headline / Insight ──
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
        upcoming_reminders=upcoming_reminders,
        recent_activity=recent_activity,
    )
