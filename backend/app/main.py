import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from .services.task_service import TaskService, TaskCreate, TaskUpdate
from .services.scheduler import generate_python_schedule
from .mcp.server import router as mcp_router

app = FastAPI(
    title="Daymark API",
    description="Backend API for Daymark AI productivity assistant",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

task_service = TaskService()
app.include_router(mcp_router)

class PlanRequest(BaseModel):
    available_minutes: int = 180
    start_time: str = "09:00"

class ChatRequest(BaseModel):
    message: str
    mode: Optional[str] = "local"

@app.get("/api/v1/health")
def get_health():
    tasks = task_service.get_tasks()
    return {
        "status": "healthy",
        "app": "Daymark",
        "tagline": "Make the next step obvious.",
        "tasks_count": len(tasks),
        "mcp_status": "active",
    }

@app.get("/api/v1/tasks")
def list_tasks(filter: str = "all", sort: str = "default"):
    tasks = task_service.get_tasks(status=filter, sort=sort)
    return {"tasks": [t.model_dump() for t in tasks], "count": len(tasks)}

@app.post("/api/v1/tasks", status_code=201)
def create_task(data: TaskCreate):
    task = task_service.create_task(data)
    return {"task": task.model_dump()}

@app.post("/api/v1/tasks/{task_id}/complete")
def complete_task(task_id: str):
    try:
        task = task_service.complete_task(task_id)
        return {"task": task.model_dump()}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.delete("/api/v1/tasks/{task_id}")
def delete_task(task_id: str):
    success = task_service.delete_task(task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"success": True}

@app.post("/api/v1/plans/generate")
def generate_plan(req: PlanRequest):
    tasks = task_service.get_tasks()
    plan = generate_python_schedule(tasks, available_minutes=req.available_minutes, start_time=req.start_time)
    return {"plan": plan.model_dump()}

@app.get("/api/v1/activity")
def get_activity(limit: int = 25):
    return {"activities": task_service.get_activities(limit=limit)}

@app.post("/api/v1/demo/load")
def load_demo():
    task_service.load_demo()
    return {"message": "Demo data loaded successfully"}

@app.post("/api/v1/demo/reset")
def reset_demo():
    task_service.reset_demo()
    return {"message": "Demo data reset successfully"}
