from datetime import date, timedelta
from typing import Any

from app.services.supabase import supabase


LEVELS: list[tuple[int, str]] = [
    (0, "Admin Rookie"),
    (200, "Task Tracker"),
    (500, "Life Organizer"),
    (1000, "Admin Pro"),
    (2000, "System Architect"),
    (4000, "Inbox Zero Master"),
    (7500, "Life Admin Legend"),
]


def get_level_for_xp(xp_total: int) -> tuple[int, str, int | None]:
    """Return the current level, title, and next threshold for an XP total."""
    current_level = 1
    current_title = LEVELS[0][1]
    next_threshold: int | None = None

    for index, (threshold, title) in enumerate(LEVELS):
        if xp_total >= threshold:
            current_level = index + 1
            current_title = title
            next_threshold = LEVELS[index + 1][0] if index + 1 < len(LEVELS) else None

    return current_level, current_title, next_threshold


def shape_gamification(row: dict[str, Any]) -> dict[str, Any]:
    """Add client-friendly derived fields to a gamification row."""
    level, title, next_threshold = get_level_for_xp(row.get("xp_total", 0))
    xp_to_next = None if next_threshold is None else max(0, next_threshold - row.get("xp_total", 0))

    return {
        **row,
        "level": level,
        "level_title": title,
        "next_level_xp": next_threshold,
        "xp_to_next_level": xp_to_next,
        "badges": row.get("badges") or [],
        "daily_missions": row.get("daily_missions") or [],
    }


def get_or_create_gamification(user_id: str) -> dict[str, Any]:
    """Fetch the user's gamification row, creating one if the signup trigger missed it."""
    result = supabase.table("gamification").select("*").eq("user_id", user_id).execute()
    if result.data:
        row = result.data[0]
        shaped = shape_gamification(row)

        if shaped["level"] != row.get("level"):
            supabase.table("gamification").update({"level": shaped["level"]}).eq("user_id", user_id).execute()
            shaped["level"] = shaped["level"]

        return shaped

    inserted = supabase.table("gamification").insert({"user_id": user_id}).execute()
    return shape_gamification(inserted.data[0])


def award_task_completion(user_id: str, task: dict[str, Any]) -> dict[str, Any]:
    """Award XP and update streaks for a newly completed task.

    The task_reward_events unique task_id constraint keeps XP idempotent.
    """
    task_id = task["id"]
    base_xp = int(task.get("xp_value") or 0)
    bonus_xp = 0
    today = date.today()

    due_date_value = task.get("due_date")
    if due_date_value:
        due_date = date.fromisoformat(str(due_date_value))
        if today <= due_date:
            bonus_xp += 10

    xp_awarded = base_xp + bonus_xp

    try:
        event = (
            supabase.table("task_reward_events")
            .insert({
                "task_id": task_id,
                "user_id": user_id,
                "xp_awarded": xp_awarded,
                "reason": "task_completed",
            })
            .execute()
        )
    except Exception:
        return get_or_create_gamification(user_id)

    if not event.data:
        return get_or_create_gamification(user_id)

    current = get_or_create_gamification(user_id)
    last_date_raw = current.get("streak_last_date")
    last_date = date.fromisoformat(str(last_date_raw)) if last_date_raw else None

    streak_current = int(current.get("streak_current") or 0)
    if last_date == today:
        next_streak = streak_current
    elif last_date == today - timedelta(days=1):
        next_streak = streak_current + 1
    else:
        next_streak = 1

    xp_total = int(current.get("xp_total") or 0) + xp_awarded
    next_level, _, _ = get_level_for_xp(xp_total)
    streak_longest = max(int(current.get("streak_longest") or 0), next_streak)

    updated = (
        supabase.table("gamification")
        .update({
            "xp_total": xp_total,
            "level": next_level,
            "streak_current": next_streak,
            "streak_longest": streak_longest,
            "streak_last_date": today.isoformat(),
        })
        .eq("user_id", user_id)
        .execute()
    )

    return shape_gamification(updated.data[0] if updated.data else current)
