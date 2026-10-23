import pytest
from backend.app.services.task_service import TaskModel
from backend.app.services.scheduler import generate_python_schedule

def test_deterministic_schedule_within_budget():
    tasks = [
        TaskModel(id="1", title="Task A", duration_minutes=60, priority="high", completed=False, created_at="", updated_at=""),
        TaskModel(id="2", title="Task B", duration_minutes=60, priority="medium", completed=False, created_at="", updated_at=""),
        TaskModel(id="3", title="Task C", duration_minutes=60, priority="low", completed=False, created_at="", updated_at=""),
    ]
    plan = generate_python_schedule(tasks, available_minutes=150, start_time="09:00", break_duration=10)
    assert plan.total_scheduled_minutes <= 150
    assert len(plan.blocks) > 0
    assert len(plan.overflow_tasks) >= 1
