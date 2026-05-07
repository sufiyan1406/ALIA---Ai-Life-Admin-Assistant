"""
ALIA Background Scheduler
Runs inside the FastAPI process using APScheduler.

Jobs:
  1. process_due_reminders  — every 60s, sends emails for due reminders
  2. auto_generate_reminders — every 5min, creates default reminders for tasks with due dates
  3. detect_overdue_tasks    — every 5min, creates overdue reminders for past-due tasks
"""

import logging
from datetime import datetime, timedelta, timezone

from apscheduler.schedulers.background import BackgroundScheduler

from app.services.email import send_reminder_email
from app.services.supabase import supabase

logger = logging.getLogger("alia.scheduler")

scheduler = BackgroundScheduler(timezone="UTC")

MAX_RETRIES = 3


# ────────────────────────────────────────────────────────────
# JOB 1: Process Due Reminders
# ────────────────────────────────────────────────────────────

def process_due_reminders():
    """Find pending reminders that are due and send notifications."""
    try:
        now = datetime.now(timezone.utc)
        now_iso = now.isoformat()

        # Get pending reminders that are due
        result = (
            supabase.table("reminders")
            .select("*, tasks(task_name, due_date, status, priority), users(email, quiet_hours_start, quiet_hours_end)")
            .eq("status", "pending")
            .lte("remind_at", now_iso)
            .limit(50)
            .execute()
        )

        reminders = result.data or []
        if not reminders:
            return

        logger.info("Processing %d due reminder(s)...", len(reminders))

        for reminder in reminders:
            task_data = reminder.get("tasks")
            user_data = reminder.get("users")

            if not task_data or not user_data:
                # Mark as sent to avoid reprocessing orphaned records
                supabase.table("reminders").update({
                    "status": "sent", "sent": True, "sent_at": now_iso
                }).eq("id", reminder["id"]).execute()
                continue

            # Skip reminders for completed/archived tasks
            if task_data.get("status") in ("done", "archived"):
                supabase.table("reminders").update({
                    "status": "sent", "sent": True, "sent_at": now_iso
                }).eq("id", reminder["id"]).execute()
                continue

            # Skip if max retries exceeded
            if reminder.get("retry_count", 0) >= MAX_RETRIES:
                supabase.table("reminders").update({
                    "status": "failed"
                }).eq("id", reminder["id"]).execute()
                logger.warning("Reminder %s permanently failed after %d retries", reminder["id"], MAX_RETRIES)
                continue

            channel = reminder.get("channel", "in-app")

            to_email = user_data.get("email")
            
            # Fallback: if email is not in public.users, we need to fetch it from auth
            if not to_email:
                try:
                    auth_user = supabase.auth.admin.get_user_by_id(reminder["user_id"])
                    if auth_user and auth_user.user:
                        to_email = auth_user.user.email
                except Exception as e:
                    logger.error("Failed to fetch email for user %s: %s", reminder["user_id"], str(e))

            if not to_email:
                logger.warning("No email found for reminder %s (user %s)", reminder["id"], reminder["user_id"])
                # Mark as failed after retries
                new_retry = reminder.get("retry_count", 0) + 1
                supabase.table("reminders").update({"retry_count": new_retry, "status": "failed" if new_retry >= MAX_RETRIES else "pending"}).eq("id", reminder["id"]).execute()
                continue

            if channel == "email":
                # Check quiet hours
                if _is_quiet_hours(user_data, now):
                    logger.info("Skipping email for reminder %s — quiet hours active", reminder["id"])
                    continue

                success = send_reminder_email(
                    to_email=to_email,
                    task_name=task_data["task_name"],
                    due_date=task_data.get("due_date"),
                    priority=task_data.get("priority", "Medium"),
                    remind_at=reminder["remind_at"],
                )

                if success:
                    supabase.table("reminders").update({
                        "status": "sent", "sent": True, "sent_at": now_iso
                    }).eq("id", reminder["id"]).execute()
                else:
                    # Increment retry count on failure
                    new_retry = reminder.get("retry_count", 0) + 1
                    new_status = "failed" if new_retry >= MAX_RETRIES else "pending"
                    supabase.table("reminders").update({
                        "retry_count": new_retry,
                        "status": new_status,
                    }).eq("id", reminder["id"]).execute()
                    logger.warning("Email failed for reminder %s (retry %d/%d)", reminder["id"], new_retry, MAX_RETRIES)
            else:
                # In-app reminders: mark as sent (frontend polls for these)
                supabase.table("reminders").update({
                    "status": "sent", "sent": True, "sent_at": now_iso
                }).eq("id", reminder["id"]).execute()

        logger.info("Processed %d reminder(s)", len(reminders))

    except Exception as e:
        logger.error("Error processing reminders: %s", str(e))


def _is_quiet_hours(user_data: dict, now: datetime) -> bool:
    """Check if the current time falls within the user's quiet hours."""
    start = user_data.get("quiet_hours_start")
    end = user_data.get("quiet_hours_end")
    if not start or not end:
        return False

    try:
        # Parse time strings like "22:00:00"
        start_parts = [int(p) for p in str(start).split(":")]
        end_parts = [int(p) for p in str(end).split(":")]
        current_hour, current_minute = now.hour, now.minute

        start_minutes = start_parts[0] * 60 + start_parts[1]
        end_minutes = end_parts[0] * 60 + end_parts[1]
        current_minutes = current_hour * 60 + current_minute

        if start_minutes <= end_minutes:
            # Same day range (e.g., 09:00 - 17:00)
            return start_minutes <= current_minutes <= end_minutes
        else:
            # Overnight range (e.g., 22:00 - 07:00)
            return current_minutes >= start_minutes or current_minutes <= end_minutes
    except (ValueError, IndexError):
        return False


# ────────────────────────────────────────────────────────────
# JOB 2: Auto-Generate Default Reminders
# ────────────────────────────────────────────────────────────

def auto_generate_reminders():
    """Create default reminders for tasks that have a due_date but no reminders yet.
    
    Priority-aware timing:
      - Urgent: 1h before
      - High: 3h before  
      - Medium: 24h before
      - Low: no auto-reminder
    
    Respects user reminder_intensity preference:
      - minimal: only Urgent
      - normal: Urgent + High
      - aggressive: Urgent + High + Medium
    """
    try:
        now = datetime.now(timezone.utc)
        today_str = now.date().isoformat()

        # Get active tasks with a future due_date
        tasks_result = (
            supabase.table("tasks")
            .select("id, user_id, due_date, priority")
            .not_.in_("status", ["done", "archived"])
            .gte("due_date", today_str)
            .execute()
        )

        tasks = tasks_result.data or []
        if not tasks:
            return

        # Get all existing reminders for these tasks to avoid duplicates for the same offset
        task_ids = [t["id"] for t in tasks]
        existing_result = (
            supabase.table("reminders")
            .select("task_id, remind_at")
            .in_("task_id", task_ids)
            .execute()
        )
        
        # Track existing reminder times to avoid double-scheduling
        # We'll use (task_id, iso_timestamp) as the key
        existing_reminders = {
            (r["task_id"], r["remind_at"]) for r in (existing_result.data or [])
        }
        
        created_count = 0
        for task in tasks:
            due_date = task["due_date"]
            if not due_date:
                continue

            # Parse due_date (assuming 9 AM on the due day as the target)
            try:
                due_dt = datetime.strptime(due_date, "%Y-%m-%d").replace(
                    hour=9, minute=0, tzinfo=timezone.utc
                )
            except ValueError:
                continue

            # We now create TWO reminders: 24h before and 1h before
            offsets = [timedelta(hours=24), timedelta(hours=1)]
            
            for offset in offsets:
                remind_at = due_dt - offset
                remind_at_iso = remind_at.isoformat()
                
                # Only create if this specific reminder time doesn't exist for this task
                if (task["id"], remind_at_iso) not in existing_reminders:
                    if remind_at > now:
                        supabase.table("reminders").insert({
                            "task_id": task["id"],
                            "user_id": task["user_id"],
                            "remind_at": remind_at_iso,
                            "channel": "email", # Default to email as requested
                            "sent": False,
                            "status": "pending",
                            "retry_count": 0,
                        }).execute()
                        created_count += 1
                        # Add to local tracking to avoid duplicates in the same run
                        existing_reminders.add((task["id"], remind_at_iso))

        if created_count:
            logger.info("Auto-generated %d reminder(s) (1d/1h policy)", created_count)

    except Exception as e:
        logger.error("Error auto-generating reminders: %s", str(e))


# ────────────────────────────────────────────────────────────
# JOB 3: Detect Overdue Tasks
# ────────────────────────────────────────────────────────────

def detect_overdue_tasks():
    """Create a one-time overdue reminder for tasks past their due date that have no active reminder."""
    try:
        now = datetime.now(timezone.utc)
        today_str = now.date().isoformat()

        # Get active tasks that are overdue
        overdue_result = (
            supabase.table("tasks")
            .select("id, user_id, task_name, due_date, priority")
            .not_.in_("status", ["done", "archived"])
            .lt("due_date", today_str)
            .execute()
        )

        overdue_tasks = overdue_result.data or []
        if not overdue_tasks:
            return

        # Check which already have a pending/sent reminder
        task_ids = [t["id"] for t in overdue_tasks]
        existing_result = (
            supabase.table("reminders")
            .select("task_id, status")
            .in_("task_id", task_ids)
            .in_("status", ["pending", "sent"])
            .execute()
        )
        tasks_with_active_reminders = {r["task_id"] for r in (existing_result.data or [])}

        created_count = 0
        for task in overdue_tasks:
            if task["id"] in tasks_with_active_reminders:
                continue

            # Create an immediate in-app overdue reminder
            supabase.table("reminders").insert({
                "task_id": task["id"],
                "user_id": task["user_id"],
                "remind_at": now.isoformat(),
                "channel": "in-app",
                "sent": True,
                "status": "sent",
                "sent_at": now.isoformat(),
                "retry_count": 0,
            }).execute()
            created_count += 1

        if created_count:
            logger.info("Created %d overdue reminder(s)", created_count)

    except Exception as e:
        logger.error("Error detecting overdue tasks: %s", str(e))


# ────────────────────────────────────────────────────────────
# SCHEDULER LIFECYCLE
# ────────────────────────────────────────────────────────────

def start_scheduler():
    """Register jobs and start the background scheduler."""
    scheduler.add_job(
        process_due_reminders,
        "interval",
        seconds=60,
        id="process_due_reminders",
        replace_existing=True,
    )
    scheduler.add_job(
        auto_generate_reminders,
        "interval",
        minutes=5,
        id="auto_generate_reminders",
        replace_existing=True,
    )
    scheduler.add_job(
        detect_overdue_tasks,
        "interval",
        minutes=5,
        id="detect_overdue_tasks",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("🕐 Background scheduler started (3 jobs)")


def stop_scheduler():
    """Gracefully shut down the scheduler."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Background scheduler stopped")
