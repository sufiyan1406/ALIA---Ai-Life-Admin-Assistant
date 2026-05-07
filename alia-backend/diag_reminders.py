import os
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

from app.services.supabase import supabase

def diag():
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    
    print(f"\n--- Diagnostic Started ---")
    print(f"Current UTC Time: {now_iso}")
    
    # Check for ALL reminders (pending, sent, failed)
    result = supabase.table("reminders").select("*, tasks(task_name), users(email)").order("created_at", desc=True).limit(5).execute()
    reminders = result.data or []
    
    if not reminders:
        print("\n❌ No reminders found in the database.")
        return

    print(f"\nFound {len(reminders)} most recent reminder(s):")
    for r in reminders:
        task_name = r.get("tasks", {}).get("task_name", "Unknown Task")
        user_email = r.get("users", {}).get("email", "MISSING")
        remind_at = r["remind_at"]
        status = r.get("status", "pending")
        
        print(f"\nTask      : {task_name}")
        print(f"Status    : {status.upper()}")
        print(f"Remind At : {remind_at}")
        print(f"Channel   : {r['channel']}")
        print(f"Sent At   : {r.get('sent_at', 'N/A')}")
        print(f"Retry Cnt : {r.get('retry_count', 0)}")

if __name__ == "__main__":
    diag()
