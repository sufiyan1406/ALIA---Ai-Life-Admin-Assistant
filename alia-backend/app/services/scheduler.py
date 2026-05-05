"""
ALIA Background Scheduler
Runs inside the FastAPI process using APScheduler.

Jobs:
  1. process_due_reminders  — every 60s, sends emails for due reminders
  2. auto_generate_reminders — every 5min, creates default reminders for tasks with due dates
"""

import logging
from datetime import datetime, timedelta, timezone

from apscheduler.schedulers.background import BackgroundScheduler

from app.services.email import send_reminder_email
from app.services.supabase import supabase

logger = logging.getLogger("alia.scheduler")

scheduler = BackgroundScheduler(timezone="UTC")


# ────────────────────────────────────────────────────────────
# JOB 1: Process Due Reminders
# ────────────────────────────────────────────────────────────

def process_due_reminders():
    """Find unsent reminders that are due and send notifications."""
    try:
        now = datetime.now(timezone.utc).isoformat()

        # Get unsent reminders that are due
        result = (
            supabase.table("reminders")
            .select("*, tasks(task_name, due_date, status), users(email)")
            .eq("sent", False)
            .lte("remind_at", now)
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
                supabase.table("reminders").update({"sent": True}).eq("id", reminder["id"]).execute()
                continue

            # Skip reminders for completed/archived tasks
            if task_data.get("status") in ("done", "archived"):
                supabase.table("reminders").update({"sent": True}).eq("id", reminder["id"]).execute()
                continue

            # Send email
            channel = reminder.get("channel", "in-app")
            if channel == "email":
                send_reminder_email(
                    to_email=user_data["email"],
                    task_name=task_data["task_name"],
                    due_date=task_data.get("due_date"),
                    remind_at=reminder["remind_at"],
                )

            # Mark as sent regardless of channel (in-app reminders are "sent" = shown)
            supabase.table("reminders").update({"sent": True}).eq("id", reminder["id"]).execute()

        logger.info("Processed %d reminder(s)", len(reminders))

    except Exception as e:
        logger.error("Error processing reminders: %s", str(e))


# ────────────────────────────────────────────────────────────
# JOB 2: Auto-Generate Default Reminders
# ────────────────────────────────────────────────────────────

def auto_generate_reminders():
    """Create default reminders for tasks that have a due_date but no reminders yet."""
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

        # Get all existing reminders for these tasks (to avoid duplicates)
        task_ids = [t["id"] for t in tasks]
        existing_result = (
            supabase.table("reminders")
            .select("task_id")
            .in_("task_id", task_ids)
            .execute()
        )
        tasks_with_reminders = {r["task_id"] for r in (existing_result.data or [])}

        created_count = 0
        for task in tasks:
            if task["id"] in tasks_with_reminders:
                continue

            due_date = task["due_date"]
            if not due_date:
                continue

            # Parse due_date (it's a DATE, not datetime)
            try:
                due_dt = datetime.strptime(due_date, "%Y-%m-%d").replace(
                    hour=9, minute=0, tzinfo=timezone.utc  # Assume 9 AM UTC as default
                )
            except ValueError:
                continue

            reminders_to_create = []

            # Reminder 1: 24 hours before (only if that's in the future)
            remind_24h = due_dt - timedelta(hours=24)
            if remind_24h > now:
                reminders_to_create.append({
                    "task_id": task["id"],
                    "user_id": task["user_id"],
                    "remind_at": remind_24h.isoformat(),
                    "channel": "in-app",
                    "sent": False,
                })

            # Reminder 2: 1 hour before (only if that's in the future)
            remind_1h = due_dt - timedelta(hours=1)
            if remind_1h > now:
                reminders_to_create.append({
                    "task_id": task["id"],
                    "user_id": task["user_id"],
                    "remind_at": remind_1h.isoformat(),
                    "channel": "in-app",
                    "sent": False,
                })

            if reminders_to_create:
                supabase.table("reminders").insert(reminders_to_create).execute()
                created_count += len(reminders_to_create)

        if created_count:
            logger.info("Auto-generated %d default reminder(s)", created_count)

    except Exception as e:
        logger.error("Error auto-generating reminders: %s", str(e))


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
    scheduler.start()
    logger.info("🕐 Background scheduler started (2 jobs)")


def stop_scheduler():
    """Gracefully shut down the scheduler."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Background scheduler stopped")
