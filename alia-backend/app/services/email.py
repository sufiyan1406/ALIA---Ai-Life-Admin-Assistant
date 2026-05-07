"""
ALIA Email Notification Service
Sends reminder emails via SMTP. Gracefully skips if SMTP is not configured.
"""

import logging
import smtplib
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import settings

logger = logging.getLogger("alia.email")


def _priority_color(priority: str) -> str:
    """Map task priority to a hex color for the email template."""
    colors = {
        "Urgent": "#FF6B6B",
        "High": "#FFFBCC",
        "Medium": "#C8B6FF",
        "Low": "#F5F0E8",
    }
    return colors.get(priority, "#F5F0E8")


def _build_reminder_html(task_name: str, due_date: str | None, priority: str, remind_at: str) -> str:
    """Build a styled HTML email body for a task reminder."""
    due_section = ""
    if due_date:
        due_section = f"""
        <tr>
          <td style="padding: 8px 16px; font-family: monospace; font-size: 13px; color: #666;">
            📅 Due: <strong>{due_date}</strong>
          </td>
        </tr>
        """

    priority_color = _priority_color(priority)

    return f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0; padding:0; background-color:#F5F0E8; font-family: 'Segoe UI', Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F0E8; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="background-color:#fff; border: 3px solid #1A1A1A; box-shadow: 6px 6px 0px #1A1A1A;">
              <!-- Header -->
              <tr>
                <td style="background-color:#C8B6FF; padding: 20px 24px; border-bottom: 3px solid #1A1A1A;">
                  <h1 style="margin:0; font-family: 'Impact', sans-serif; font-size: 24px; color: #1A1A1A; letter-spacing: 2px;">
                    🔔 ALIA REMINDER
                  </h1>
                </td>
              </tr>
              <!-- Priority Bar -->
              <tr>
                <td style="background-color: {priority_color}; padding: 8px 24px; border-bottom: 2px solid #1A1A1A;">
                  <span style="font-family: monospace; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; color: #1A1A1A;">
                    Priority: {priority}
                  </span>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding: 28px 24px;">
                  <p style="margin: 0 0 8px 0; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 1px;">
                    Task Reminder
                  </p>
                  <h2 style="margin: 0 0 20px 0; font-size: 22px; color: #1A1A1A; border-left: 4px solid #BFFF00; padding-left: 12px;">
                    {task_name}
                  </h2>
                </td>
              </tr>
              {due_section}
              <!-- Footer -->
              <tr>
                <td style="padding: 16px 24px; background-color: #FFFBCC; border-top: 2px solid #1A1A1A;">
                  <p style="margin:0; font-size: 12px; color: #666; font-family: monospace;">
                    Sent by ALIA — your AI Life Admin Assistant
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """


def send_reminder_email(
    to_email: str,
    task_name: str,
    due_date: str | None = None,
    priority: str = "Medium",
    remind_at: str | None = None,
) -> bool:
    """
    Send a reminder email for a task.
    Returns True if sent successfully, False if skipped or failed.
    """
    if not settings.email_configured:
        logger.info("SMTP not configured — skipping email for task '%s'", task_name)
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"🔔 Reminder: {task_name}"
        msg["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email or settings.smtp_user}>"
        msg["To"] = to_email

        # Plain text fallback
        plain_text = f"Reminder: {task_name}"
        if due_date:
            plain_text += f"\nDue: {due_date}"
        plain_text += f"\nPriority: {priority}"
        plain_text += "\n\n— ALIA Assistant"

        # HTML version
        html_body = _build_reminder_html(task_name, due_date, priority, remind_at or "")

        msg.attach(MIMEText(plain_text, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(settings.smtp_user, settings.smtp_password)
            server.send_message(msg)

        logger.info("✉️  Reminder email sent to %s for task '%s'", to_email, task_name)
        return True

    except Exception as e:
        logger.error("Failed to send reminder email to %s: %s", to_email, str(e))
        return False
