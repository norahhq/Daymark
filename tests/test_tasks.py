import pytest
from backend.app.services.task_service import TaskService, TaskCreate

def test_create_and_fetch_task():
    service = TaskService()
    task = service.create_task(TaskCreate(title="Test Task", duration_minutes=30, priority="high"))
    assert task.title == "Test Task"
    assert task.duration_minutes == 30
    assert task.completed is False

    tasks = service.get_tasks()
    matching = [t for t in tasks if t.id == task.id]
    assert len(matching) == 1

def test_complete_task():
    service = TaskService()
    task = service.create_task(TaskCreate(title="To Complete", duration_minutes=45))
    completed = service.complete_task(task.id)
    assert completed.completed is True

def test_delete_task():
    service = TaskService()
    task = service.create_task(TaskCreate(title="To Delete", duration_minutes=20))
    res = service.delete_task(task.id)
    assert res is True
