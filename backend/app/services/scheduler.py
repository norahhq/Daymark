from typing import List, Tuple
from .task_service import TaskModel, ScheduleBlockModel, DayPlanModel
from datetime import datetime

def parse_time_to_minutes(time_str: str) -> int:
    parts = time_str.split(":")
    return int(parts[0]) * 60 + int(parts[1])

def minutes_to_time_str(total_minutes: int) -> str:
    norm = ((total_minutes % 1440) + 1440) % 1440
    h = norm // 60
    m = norm % 60
    return f"{h:02d}:{m:02d}"

def calculate_priority_score(task: TaskModel) -> int:
    score = 0
    if task.priority == "high":
        score += 100
    elif task.priority == "medium":
        score += 50
    else:
        score += 20
    return score

def generate_python_schedule(
    tasks: List[TaskModel],
    available_minutes: int = 180,
    start_time: str = "09:00",
    break_duration: int = 10,
) -> DayPlanModel:
    pending = [t for t in tasks if not t.completed]
    sorted_tasks = sorted(
        pending,
        key=lambda t: (-calculate_priority_score(t), t.duration_minutes),
    )

    start_min = parse_time_to_minutes(start_time)
    current_offset = 0
    blocks: List[ScheduleBlockModel] = []
    overflow: List[TaskModel] = []

    for task in sorted_tasks:
        needs_break = len(blocks) > 0 and break_duration > 0
        required = current_offset + (break_duration if needs_break else 0) + task.duration_minutes

        if required <= available_minutes:
            if needs_break:
                b_start = start_min + current_offset
                b_end = b_start + break_duration
                blocks.append(
                    ScheduleBlockModel(
                        id=f"break-{len(blocks)+1}",
                        title="Rest & Context Switch",
                        type="break",
                        start_time=minutes_to_time_str(b_start),
                        end_time=minutes_to_time_str(b_end),
                        duration_minutes=break_duration,
                    )
                )
                current_offset += break_duration

            t_start = start_min + current_offset
            t_end = t_start + task.duration_minutes
            blocks.append(
                ScheduleBlockModel(
                    id=f"block-{task.id}",
                    task_id=task.id,
                    title=task.title,
                    type="task",
                    start_time=minutes_to_time_str(t_start),
                    end_time=minutes_to_time_str(t_end),
                    duration_minutes=task.duration_minutes,
                    priority=task.priority,
                )
            )
            current_offset += task.duration_minutes
        else:
            overflow.append(task)

    remaining = max(0, available_minutes - current_offset)
    utilization = min(100, int((current_offset / available_minutes) * 100))

    return DayPlanModel(
        id=f"plan-{int(datetime.utcnow().timestamp())}",
        available_minutes=available_minutes,
        start_time=start_time,
        total_scheduled_minutes=current_offset,
        remaining_minutes=remaining,
        utilization_percent=utilization,
        blocks=blocks,
        overflow_tasks=overflow,
        created_at=datetime.utcnow().isoformat(),
    )
