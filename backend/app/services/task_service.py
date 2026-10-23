import sqlite3
import os
import json
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

DB_DIR = os.path.join(os.getcwd(), "data")
DB_PATH = os.path.join(DB_DIR, "daymark.db")

class TaskModel(BaseModel):
    id: str
    title: str
    duration_minutes: int
    priority: str = "medium"
    deadline: Optional[str] = None
    completed: bool = False
    created_at: str
    updated_at: str

class TaskCreate(BaseModel):
    title: str
    duration_minutes: int = Field(ge=5, le=480)
    priority: str = "medium"
    deadline: Optional[str] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    duration_minutes: Optional[int] = Field(default=None, ge=5, le=480)
    priority: Optional[str] = None
    deadline: Optional[str] = None
    completed: Optional[bool] = None

class ScheduleBlockModel(BaseModel):
    id: str
    task_id: Optional[str] = None
    title: str
    type: str # "task" or "break"
    start_time: str
    end_time: str
    duration_minutes: int
    priority: Optional[str] = None

class DayPlanModel(BaseModel):
    id: str
    available_minutes: int
    start_time: str
    total_scheduled_minutes: int
    remaining_minutes: int
    utilization_percent: int
    blocks: List[ScheduleBlockModel]
    overflow_tasks: List[TaskModel]
    created_at: str

def init_db():
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            duration_minutes INTEGER NOT NULL,
            priority TEXT NOT NULL,
            deadline TEXT,
            completed INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS activities (
            id TEXT PRIMARY KEY,
            action_type TEXT NOT NULL,
            description TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            metadata TEXT
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS plans (
            id TEXT PRIMARY KEY,
            available_minutes INTEGER NOT NULL,
            start_time TEXT NOT NULL,
            total_scheduled_minutes INTEGER NOT NULL,
            remaining_minutes INTEGER NOT NULL,
            utilization_percent INTEGER NOT NULL,
            plan_data TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()

class TaskService:
    def __init__(self):
        init_db()

    def _get_conn(self):
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn

    def get_tasks(self, status: str = "all", sort: str = "default") -> List[TaskModel]:
        conn = self._get_conn()
        cursor = conn.cursor()
        query = "SELECT * FROM tasks"
        params = []
        if status == "pending":
            query += " WHERE completed = 0"
        elif status == "completed":
            query += " WHERE completed = 1"

        if sort == "priority":
            query += " ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END"
        elif sort == "duration":
            query += " ORDER BY duration_minutes ASC"
        else:
            query += " ORDER BY created_at DESC"

        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()
        return [
            TaskModel(
                id=row["id"],
                title=row["title"],
                duration_minutes=row["duration_minutes"],
                priority=row["priority"],
                deadline=row["deadline"],
                completed=bool(row["completed"]),
                created_at=row["created_at"],
                updated_at=row["updated_at"],
            )
            for row in rows
        ]

    def create_task(self, data: TaskCreate) -> TaskModel:
        now = datetime.utcnow().isoformat()
        task_id = f"task-{int(datetime.utcnow().timestamp() * 1000)}"
        conn = self._get_conn()
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO tasks (id, title, duration_minutes, priority, deadline, completed, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 0, ?, ?)
            """,
            (task_id, data.title, data.duration_minutes, data.priority, data.deadline, now, now),
        )
        self.add_activity("task_created", f"Created task '{data.title}' ({data.duration_minutes}m)")
        conn.commit()
        conn.close()
        return TaskModel(
            id=task_id,
            title=data.title,
            duration_minutes=data.duration_minutes,
            priority=data.priority,
            deadline=data.deadline,
            completed=False,
            created_at=now,
            updated_at=now,
        )

    def complete_task(self, task_id: str) -> TaskModel:
        conn = self._get_conn()
        cursor = conn.cursor()
        now = datetime.utcnow().isoformat()
        cursor.execute("UPDATE tasks SET completed = 1, updated_at = ? WHERE id = ?", (now, task_id))
        if cursor.rowcount == 0:
            conn.close()
            raise ValueError(f"Task '{task_id}' not found")
        conn.commit()
        conn.close()
        tasks = [t for t in self.get_tasks() if t.id == task_id]
        if tasks:
            self.add_activity("task_completed", f"Completed task '{tasks[0].title}'")
            return tasks[0]
        raise ValueError(f"Task '{task_id}' not found")

    def delete_task(self, task_id: str) -> bool:
        conn = self._get_conn()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
        success = cursor.rowcount > 0
        conn.commit()
        conn.close()
        if success:
            self.add_activity("task_deleted", f"Deleted task '{task_id}'")
        return success

    def add_activity(self, action_type: str, description: str, metadata: Optional[Dict[str, Any]] = None):
        conn = self._get_conn()
        cursor = conn.cursor()
        act_id = f"act-{int(datetime.utcnow().timestamp() * 1000)}"
        cursor.execute(
            "INSERT INTO activities (id, action_type, description, timestamp, metadata) VALUES (?, ?, ?, ?, ?)",
            (act_id, action_type, description, datetime.utcnow().isoformat(), json.dumps(metadata or {})),
        )
        conn.commit()
        conn.close()

    def get_activities(self, limit: int = 25) -> List[Dict[str, Any]]:
        conn = self._get_conn()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM activities ORDER BY timestamp DESC LIMIT ?", (limit,))
        rows = cursor.fetchall()
        conn.close()
        return [
            {
                "id": r["id"],
                "action_type": r["action_type"],
                "description": r["description"],
                "timestamp": r["timestamp"],
                "metadata": json.loads(r["metadata"] or "{}"),
            }
            for r in rows
        ]

    def reset_demo(self):
        conn = self._get_conn()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM tasks")
        cursor.execute("DELETE FROM plans")
        cursor.execute("DELETE FROM activities")
        conn.commit()
        conn.close()
        self.add_activity("demo_reset", "Workspace reset to pristine empty state")

    def load_demo(self):
        self.reset_demo()
        demo_items = [
            ("Finish project prototype", 90, "high"),
            ("Review lecture notes", 60, "medium"),
            ("Prepare hackathon demo", 45, "high"),
            ("Reply to project team", 20, "low"),
            ("Practice calculus problems", 50, "high"),
        ]
        for title, duration, priority in demo_items:
            self.create_task(TaskCreate(title=title, duration_minutes=duration, priority=priority))
        self.add_activity("demo_loaded", "Loaded 5 realistic demo tasks")
