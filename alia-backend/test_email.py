"""
Quick SMTP test script for ALIA email reminders.
Run from the alia-backend directory:

    python test_email.py your@email.com

It will send a test reminder email immediately and report success/failure.
"""

import sys
import os

# Load .env before importing app modules
from dotenv import load_dotenv
load_dotenv()

from app.config import settings
from app.services.email import send_reminder_email


def main():
    to_email = sys.argv[1] if len(sys.argv) > 1 else settings.smtp_user

    print("\n=== ALIA Email Test ===")
    print(f"SMTP Host    : {settings.smtp_host or '[NOT SET]'}")
    print(f"SMTP Port    : {settings.smtp_port}")
    print(f"SMTP User    : {settings.smtp_user or '[NOT SET]'}")
    print(f"From Email   : {settings.smtp_from_email or '[NOT SET]'}")
    print(f"Configured   : {'YES ✓' if settings.email_configured else 'NO ✗'}")
    print(f"Sending to   : {to_email}")
    print("=" * 30)

    if not settings.email_configured:
        print("\n[ERROR] SMTP is not configured.")
        print("Fill in SMTP_HOST, SMTP_USER, SMTP_PASSWORD in your .env file.")
        print("\nExample for Gmail:")
        print("  SMTP_HOST=smtp.gmail.com")
        print("  SMTP_PORT=587")
        print("  SMTP_USER=your.email@gmail.com")
        print("  SMTP_PASSWORD=xxxx xxxx xxxx xxxx  ← Gmail App Password")
        print("  SMTP_FROM_EMAIL=your.email@gmail.com")
        sys.exit(1)

    print("\nSending test reminder email...")
    success = send_reminder_email(
        to_email=to_email,
        task_name="[TEST] Pay Electricity Bill",
        due_date="Tomorrow",
        priority="High",
        remind_at="2025-05-08T09:00:00",
    )

    if success:
        print(f"\n✅ SUCCESS — Check your inbox at {to_email}")
    else:
        print("\n❌ FAILED — Check the error logs above.")
        print("Common causes:")
        print("  • Wrong App Password (regenerate at myaccount.google.com/apppasswords)")
        print("  • 2FA not enabled on the Gmail account")
        print("  • Firewall blocking port 587")
        sys.exit(1)


if __name__ == "__main__":
    main()
