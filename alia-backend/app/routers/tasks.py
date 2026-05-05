from datetime import date, datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.dependencies import CurrentUser, get_current_user
from app.models.task import TaskCreate, TaskFilters, TaskResponse, TaskSnooze, TaskUpdate, TaskSummary
from app.services.gamification import award_task_completion
from app.services.supabase import supabase

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("", response_model=list[TaskResponse])
async def list_tasks(
    status_filter: Optional[str] = Query(None, alias="status"),
    priority: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    due_before: Optional[date] = Query(None),
    due_after: Optional[date] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: CurrentUser = Depends(get_current_user),
):
    """List all tasks for the current user with optional filters."""
    query = supabase.table("tasks").select("*").eq("user_id", str(current_user.id))

    if status_filter:
        query = query.eq("status", status_filter)
    if priority:
        query = query.eq("priority", priority)
    if category:
        query = query.eq("category", category)
    if due_before:
        query = query.lte("due_date", due_before.isoformat())
    if due_after:
        query = query.gte("due_date", due_after.isoformat())

    query = query.order("xp_value", desc=True).order("due_date", desc=False).range(offset, offset + limit - 1)
    result = query.execute()

    return [TaskResponse(**task) for task in (result.data or [])]


@router.get("/today", response_model=list[TaskResponse])
async def list_tasks_today(
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get tasks due today that are not done or archived."""
    today = date.today().isoformat()

    result = (
        supabase.table("tasks")
        .select("*")
        .eq("user_id", str(current_user.id))
        .eq("due_date", today)
        .not_.in_("status", ["done", "archived"])
        .order("xp_value", desc=True)
        .order("due_date", desc=False)
        .execute()
    )

    return [TaskResponse(**task) for task in (result.data or [])]


@router.get("/overdue", response_model=list[TaskResponse])
async def list_tasks_overdue(
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get overdue tasks that are not done or archived."""
    today = date.today().isoformat()

    result = (
        supabase.table("tasks")
        .select("*")
        .eq("user_id", str(current_user.id))
        .lt("due_date", today)
        .not_.in_("status", ["done", "archived"])
        .order("xp_value", desc=True)
        .order("due_date", desc=False)
        .execute()
    )

    return [TaskResponse(**task) for task in (result.data or [])]


@router.get("/upcoming", response_model=list[TaskResponse])
async def list_tasks_upcoming(
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get upcoming tasks within the next 7 days."""
    today = date.today()
    next_week = today.replace(day=today.day + 7) if today.day <= 21 else today  # basic calculation, better use timedelta
    from datetime import timedelta
    next_week = today + timedelta(days=7)

    result = (
        supabase.table("tasks")
        .select("*")
        .eq("user_id", str(current_user.id))
        .gt("due_date", today.isoformat())
        .lte("due_date", next_week.isoformat())
        .not_.in_("status", ["done", "archived"])
        .order("xp_value", desc=True)
        .order("due_date", desc=False)
        .execute()
    )

    return [TaskResponse(**task) for task in (result.data or [])]


@router.get("/summary", response_model=TaskSummary)
async def get_task_summary(
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get aggregate counts for dashboard."""
    result = supabase.table("tasks").select("status, priority, category").eq("user_id", str(current_user.id)).execute()
    tasks = result.data or []
    
    summary = {
        "by_status": {},
        "by_priority": {},
        "by_category": {},
        "total": len(tasks)
    }
    
    for t in tasks:
        s = t.get("status")
        if s: summary["by_status"][s] = summary["by_status"].get(s, 0) + 1
            
        p = t.get("priority")
        if p: summary["by_priority"][p] = summary["by_priority"].get(p, 0) + 1
            
        c = t.get("category")
        if c: summary["by_category"][c] = summary["by_category"].get(c, 0) + 1
            
    return TaskSummary(**summary)


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get a single task. Must belong to the current user."""
    result = (
        supabase.table("tasks")
        .select("*")
        .eq("id", str(task_id))
        .eq("user_id", str(current_user.id))
        .single()
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": True, "message": "Task not found", "code": "NOT_FOUND"},
        )

    return TaskResponse(**result.data)


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    body: TaskCreate,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Create a new task for the current user."""
    task_data = body.model_dump(exclude_unset=True)
    task_data["user_id"] = str(current_user.id)

    # Calculate xp_value
    priority_xp = {"Urgent": 40, "High": 30, "Medium": 20, "Low": 10}
    task_data["xp_value"] = priority_xp.get(task_data.get("priority", "Medium"), 20)

    # Convert date to string for Supabase
    if "due_date" in task_data and task_data["due_date"] is not None:
        task_data["due_date"] = task_data["due_date"].isoformat()

    result = supabase.table("tasks").insert(task_data).execute()

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": True, "message": "Failed to create task", "code": "INTERNAL_ERROR"},
        )

    created_task = result.data[0]

    # ── Auto-generate default reminders if task has a future due_date ──
    if created_task.get("due_date"):
        try:
            from datetime import timedelta
            due_dt = datetime.strptime(created_task["due_date"], "%Y-%m-%d").replace(
                hour=9, minute=0, tzinfo=timezone.utc
            )
            now = datetime.now(timezone.utc)
            auto_reminders = []

            # 24 hours before
            remind_24h = due_dt - timedelta(hours=24)
            if remind_24h > now:
                auto_reminders.append({
                    "task_id": created_task["id"],
                    "user_id": str(current_user.id),
                    "remind_at": remind_24h.isoformat(),
                    "channel": "in-app",
                    "sent": False,
                })

            # 1 hour before
            remind_1h = due_dt - timedelta(hours=1)
            if remind_1h > now:
                auto_reminders.append({
                    "task_id": created_task["id"],
                    "user_id": str(current_user.id),
                    "remind_at": remind_1h.isoformat(),
                    "channel": "in-app",
                    "sent": False,
                })

            if auto_reminders:
                supabase.table("reminders").insert(auto_reminders).execute()
        except Exception:
            pass  # Don't fail task creation if auto-reminders fail

    return TaskResponse(**created_task)



@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: UUID,
    body: TaskUpdate,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Update any task field except user_id and created_at."""
    update_data = body.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": True, "message": "No fields to update", "code": "VALIDATION_ERROR"},
        )

    # Recalculate xp_value if priority changes
    if "priority" in update_data:
        priority_xp = {"Urgent": 40, "High": 30, "Medium": 20, "Low": 10}
        update_data["xp_value"] = priority_xp.get(update_data["priority"], 20)

    # Convert date to string
    if "due_date" in update_data and update_data["due_date"] is not None:
        update_data["due_date"] = update_data["due_date"].isoformat()

    result = (
        supabase.table("tasks")
        .update(update_data)
        .eq("id", str(task_id))
        .eq("user_id", str(current_user.id))
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": True, "message": "Task not found", "code": "NOT_FOUND"},
        )

    return TaskResponse(**result.data[0])


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Hard delete a task. Must belong to the current user. Also deletes linked reminders."""
    # Delete linked reminders first
    supabase.table("reminders").delete().eq("task_id", str(task_id)).eq("user_id", str(current_user.id)).execute()
    
    result = (
        supabase.table("tasks")
        .delete()
        .eq("id", str(task_id))
        .eq("user_id", str(current_user.id))
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": True, "message": "Task not found", "code": "NOT_FOUND"},
        )


@router.patch("/{task_id}/complete", response_model=TaskResponse)
async def complete_task(
    task_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Mark a task as complete. Sets status=done, completed_at=now(), and awards XP once."""
    existing = (
        supabase.table("tasks")
        .select("*")
        .eq("id", str(task_id))
        .eq("user_id", str(current_user.id))
        .execute()
    )

    if not existing.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": True, "message": "Task not found", "code": "NOT_FOUND"},
        )

    was_done = existing.data[0].get("status") == "done"

    result = (
        supabase.table("tasks")
        .update({
            "status": "done",
            "completed_at": datetime.now(timezone.utc).isoformat(),
        })
        .eq("id", str(task_id))
        .eq("user_id", str(current_user.id))
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": True, "message": "Task not found", "code": "NOT_FOUND"},
        )

    if not was_done and result.data:
        award_task_completion(str(current_user.id), result.data[0])

    return TaskResponse(**result.data[0])


@router.patch("/{task_id}/snooze", response_model=TaskResponse)
async def snooze_task(
    task_id: UUID,
    body: TaskSnooze,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Snooze a task. Sets status=snoozed and updates due_date."""
    result = (
        supabase.table("tasks")
        .update({
            "status": "snoozed",
            "due_date": body.snooze_until.isoformat(),
        })
        .eq("id", str(task_id))
        .eq("user_id", str(current_user.id))
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": True, "message": "Task not found", "code": "NOT_FOUND"},
        )

    return TaskResponse(**result.data[0])


@router.patch("/{task_id}/reopen", response_model=TaskResponse)
async def reopen_task(
    task_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Reopen a completed task. Sets status=pending and completed_at=null."""
    result = (
        supabase.table("tasks")
        .update({
            "status": "pending",
            "completed_at": None,
        })
        .eq("id", str(task_id))
        .eq("user_id", str(current_user.id))
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": True, "message": "Task not found", "code": "NOT_FOUND"},
        )

    return TaskResponse(**result.data[0])
