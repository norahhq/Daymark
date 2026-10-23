import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  Clock,
  AlertCircle,
  Calendar,
  X,
  Filter,
  ArrowUpDown,
} from 'lucide-react';
import { Task, Priority } from '../types/index.js';

interface TaskManagementProps {
  tasks: Task[];
  filter: 'all' | 'pending' | 'completed';
  onFilterChange: (filter: 'all' | 'pending' | 'completed') => void;
  sort: string;
  onSortChange: (sort: string) => void;
  onCreateTask: (data: {
    title: string;
    durationMinutes: number;
    priority: Priority;
    deadline?: string;
  }) => Promise<void>;
  onUpdateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  onCompleteTask: (id: string) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onLoadDemo: () => Promise<void>;
}

export const TaskManagement: React.FC<TaskManagementProps> = ({
  tasks,
  filter,
  onFilterChange,
  sort,
  onSortChange,
  onCreateTask,
  onUpdateTask,
  onCompleteTask,
  onDeleteTask,
  onLoadDemo,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteConfirmTaskId, setDeleteConfirmTaskId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [priority, setPriority] = useState<Priority>('medium');
  const [deadline, setDeadline] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenCreate = () => {
    setTitle('');
    setDurationMinutes(45);
    setPriority('medium');
    setDeadline('');
    setFormError('');
    setShowCreateModal(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDurationMinutes(task.durationMinutes);
    setPriority(task.priority);
    setDeadline(task.deadline ? task.deadline.slice(0, 16) : '');
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Please enter a task title');
      return;
    }
    if (durationMinutes < 5 || durationMinutes > 480) {
      setFormError('Duration must be between 5 and 480 minutes');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingTask) {
        await onUpdateTask(editingTask.id, {
          title: title.trim(),
          durationMinutes: Number(durationMinutes),
          priority,
          deadline: deadline ? new Date(deadline).toISOString() : undefined,
        });
        setEditingTask(null);
      } else {
        await onCreateTask({
          title: title.trim(),
          durationMinutes: Number(durationMinutes),
          priority,
          deadline: deadline ? new Date(deadline).toISOString() : undefined,
        });
        setShowCreateModal(false);
      }
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDeadline = (isoString?: string) => {
    if (!isoString) return null;
    const date = new Date(isoString);
    const now = new Date();
    const diffHours = (date.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < 0) {
      return 'Overdue';
    }
    if (diffHours <= 12) {
      return `Due today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (diffHours <= 36) {
      return `Due tomorrow at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return `Due ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
  };

  return (
    <div className="space-y-4">
      {/* Action and Filtering Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#10131E] border border-white/[0.08]">
        {/* Left: Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#090A0F] rounded-lg border border-white/[0.06]">
          {(['all', 'pending', 'completed'] as const).map((tab) => {
            const isActive = filter === tab;
            return (
              <button
                key={tab}
                onClick={() => onFilterChange(tab)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-lime-400/15 text-lime-400 border border-lime-400/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Right: Sort Dropdown & Add Task Button */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value)}
              className="bg-[#090A0F] border border-white/[0.08] text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-lime-400"
            >
              <option value="default">Default Order</option>
              <option value="priority">Priority (High to Low)</option>
              <option value="duration">Duration (Shortest first)</option>
              <option value="deadline">Upcoming Deadline</option>
            </select>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-lime-400 hover:bg-lime-300 text-slate-950 font-semibold text-xs transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {tasks.length === 0 ? (
          <div className="p-12 text-center rounded-xl bg-[#10131E] border border-white/[0.08] space-y-3">
            <div className="w-10 h-10 rounded-full bg-white/[0.04] text-slate-400 flex items-center justify-center mx-auto">
              <Calendar className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-white">No tasks found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              There are no tasks matching this filter. Add your first goal, or load the pre-configured sample sprint tasks.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={handleOpenCreate}
                className="px-3.5 py-1.5 rounded-lg bg-lime-400 text-slate-950 font-medium text-xs hover:bg-lime-300 transition-colors"
              >
                Create Task
              </button>
              <button
                onClick={onLoadDemo}
                className="px-3.5 py-1.5 rounded-lg bg-white/[0.06] text-slate-300 font-medium text-xs hover:bg-white/[0.1] transition-colors"
              >
                Load Sample Tasks
              </button>
            </div>
          </div>
        ) : (
          tasks.map((task) => {
            const isCompleted = task.completed;
            const deadlineText = formatDeadline(task.deadline);
            const isOverdue = deadlineText === 'Overdue';

            return (
              <div
                key={task.id}
                className={`group p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                  isCompleted
                    ? 'bg-[#0B0D14] border-white/[0.04] opacity-75'
                    : 'bg-[#10131E] border-white/[0.08] hover:border-white/[0.14]'
                }`}
              >
                {/* Left: Checkbox & Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <button
                    onClick={() => onCompleteTask(task.id)}
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                      isCompleted
                        ? 'bg-lime-400 border-lime-400 text-slate-950'
                        : 'border-white/[0.2] hover:border-lime-400 text-transparent'
                    }`}
                    title={isCompleted ? 'Completed' : 'Mark as completed'}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </button>

                  <div className="min-w-0">
                    <span
                      className={`text-sm font-medium block truncate ${
                        isCompleted ? 'line-through text-slate-400' : 'text-white'
                      }`}
                    >
                      {task.title}
                    </span>

                    {/* Unboxed Metadata with · separator */}
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-mono tabular-nums flex-wrap">
                      <span>{task.durationMinutes}m</span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={`capitalize ${
                          task.priority === 'high'
                            ? 'text-lime-400'
                            : task.priority === 'medium'
                            ? 'text-slate-300'
                            : 'text-slate-400'
                        }`}
                      >
                        {task.priority} priority
                      </span>

                      {deadlineText && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className={isOverdue ? 'text-red-400 font-semibold' : 'text-slate-400'}>
                            {deadlineText}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleOpenEdit(task)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                    title="Edit task"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmTaskId(task.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/20 transition-colors"
                    title="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Modal */}
      {(showCreateModal || editingTask) && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-[#10131E] border border-white/[0.12] rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-sm font-semibold text-white">
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingTask(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/30 text-xs text-red-300">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Finish project prototype"
                  className="w-full bg-[#090A0F] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-lime-400"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="480"
                    step="5"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full bg-[#090A0F] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-lime-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="w-full bg-[#090A0F] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-lime-400"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Deadline (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-[#090A0F] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-lime-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingTask(null);
                  }}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-lime-400 hover:bg-lime-300 text-slate-950 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmTaskId && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-[#10131E] border border-white/[0.12] rounded-xl p-5 max-w-sm w-full shadow-2xl space-y-3">
            <h3 className="text-sm font-semibold text-white">Delete Task?</h3>
            <p className="text-xs text-slate-400">
              Are you sure you want to delete this task? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmTaskId(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onDeleteTask(deleteConfirmTaskId);
                  setDeleteConfirmTaskId(null);
                }}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
