import { useState } from 'react';
import { getApiBase } from '../../lib/api';
import type { TaskItem } from '../../types/projects';

const API_BASE = getApiBase();
const errorClass = 'ring-1 ring-red-500/60 border border-red-500/60';

const taskStatusBadge: Record<string, string> = {
  todo:        'bg-slate-700 text-slate-300',
  in_progress: 'bg-sky-900 text-sky-300',
  blocked:     'bg-red-900/50 text-red-300',
  done:        'bg-emerald-900/50 text-emerald-300',
};
const taskStatusLabel: Record<string, string> = {
  todo: 'To Do', in_progress: 'In Progress', blocked: 'Blocked', done: 'Done',
};

type Props = {
  tasks:      TaskItem[];
  setTasks:   React.Dispatch<React.SetStateAction<TaskItem[]>>;
  projectId:  string;
  token:      string;
};

const TasksTab = ({ tasks, setTasks, projectId, token }: Props) => {
  const today = new Date().toISOString().split('T')[0];

  const [taskStatusFilter,      setTaskStatusFilter]      = useState('');
  const [taskCreateOpen,        setTaskCreateOpen]        = useState(false);
  const [taskSubmitAttempted,   setTaskSubmitAttempted]   = useState(false);
  const [editingTaskId,         setEditingTaskId]         = useState<string | null>(null);
  const [taskForm,              setTaskForm]              = useState<{ title: string; status: TaskItem['status'] | ''; dueDate: string }>({ title: '', status: '', dueDate: '' });
  const [taskError,             setTaskError]             = useState<string | null>(null);
  const [deletingTaskId,        setDeletingTaskId]        = useState<string | null>(null);

  const closeTaskForm = () => {
    setTaskCreateOpen(false);
    setEditingTaskId(null);
    setTaskSubmitAttempted(false);
    setTaskForm({ title: '', status: '', dueDate: '' });
    setTaskError(null);
  };

  const handleTaskSubmit = async () => {
    setTaskSubmitAttempted(true);
    if (!taskForm.title.trim() || !taskForm.status || !taskForm.dueDate) return;
    const method = editingTaskId ? 'PATCH' : 'POST';
    const url    = editingTaskId ? `${API_BASE}/tasks/${editingTaskId}` : `${API_BASE}/projects/${projectId}/tasks`;
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: taskForm.title.trim(), status: taskForm.status, dueDate: taskForm.dueDate, projectId }),
    });
    if (!res.ok) { setTaskError('Unable to save task'); return; }
    const data = (await res.json()) as { data: TaskItem };
    setTasks((prev) =>
      editingTaskId ? prev.map((t) => (t.id === data.data.id ? data.data : t)) : [data.data, ...prev]
    );
    closeTaskForm();
  };

  const handleTaskDelete = async (id: string) => {
    await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setDeletingTaskId(null);
  };

  const filtered = tasks.filter((t) =>
    !taskStatusFilter ||
    (taskStatusFilter === 'overdue'
      ? t.dueDate && t.dueDate < today && t.status !== 'done'
      : t.status === taskStatusFilter)
  );

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <div className="rounded-2xl bg-panel p-6 shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-200">Tasks</div>
            <div className="text-xs text-slate-500">Manage tasks for this project.</div>
          </div>
          {!taskCreateOpen && !editingTaskId && (
            <button
              className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-slate-950"
              onClick={() => setTaskCreateOpen(true)}
            >
              Create Task
            </button>
          )}
        </div>

        {/* Task form */}
        {(taskCreateOpen || editingTaskId) && (
          <div className="mt-4 rounded-2xl border border-slate-800 bg-surface/60 p-5">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-200">
                {editingTaskId ? 'Edit Task' : 'New Task'}
              </div>
              <button className="text-xs uppercase tracking-wide text-slate-400" onClick={closeTaskForm}>
                Cancel
              </button>
            </div>
            {taskError && (
              <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {taskError}
              </div>
            )}
            <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
              <input
                value={taskForm.title}
                onChange={(e) => setTaskForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Task title"
                className={`rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800 ${taskSubmitAttempted && !taskForm.title.trim() ? errorClass : ''}`}
              />
              <select
                value={taskForm.status}
                onChange={(e) => setTaskForm((prev) => ({ ...prev, status: e.target.value as TaskItem['status'] | '' }))}
                className={`rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800 ${taskSubmitAttempted && !taskForm.status ? errorClass : ''}`}
              >
                <option value="">Select status</option>
                {(['todo', 'in_progress', 'blocked', 'done'] as const).map((s) => (
                  <option key={s} value={s}>{taskStatusLabel[s]}</option>
                ))}
              </select>
              <input
                type="date"
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                className={`rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800 ${taskSubmitAttempted && !taskForm.dueDate ? errorClass : ''}`}
              />
            </div>
            <div className="mt-5 flex items-center gap-4">
              <button className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-slate-950" onClick={handleTaskSubmit}>
                {editingTaskId ? 'Update Task' : 'Create Task'}
              </button>
              {editingTaskId && (
                <div className="ml-auto">
                  {deletingTaskId === editingTaskId ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Are you sure?</span>
                      <button className="text-xs text-red-300" onClick={() => handleTaskDelete(editingTaskId)}>Confirm</button>
                      <button className="text-xs text-slate-400" onClick={() => setDeletingTaskId(null)}>Cancel</button>
                    </div>
                  ) : (
                    <button className="text-xs text-red-400 hover:text-red-300" onClick={() => setDeletingTaskId(editingTaskId)}>
                      Delete task
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="mt-4">
          <select
            value={taskStatusFilter}
            onChange={(e) => setTaskStatusFilter(e.target.value)}
            className="rounded-xl bg-surface px-4 py-2 text-sm text-slate-100 outline-none ring-1 ring-slate-800"
          >
            <option value="">All Statuses</option>
            <option value="overdue">Overdue</option>
            {(['todo', 'in_progress', 'blocked', 'done'] as const).map((s) => (
              <option key={s} value={s}>{taskStatusLabel[s]}</option>
            ))}
          </select>
        </div>

        {/* Task list */}
        <div className="mt-3 divide-y divide-slate-800 text-sm">
          {filtered.length === 0 ? (
            <div className="text-slate-400">{tasks.length === 0 ? 'No tasks yet.' : 'No tasks match this filter.'}</div>
          ) : (
            filtered.map((task) => {
              const isOverdue = task.dueDate && task.dueDate < today && task.status !== 'done';
              return (
                <div key={task.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-slate-100">{task.title}</div>
                      {isOverdue && (
                        <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-300">Overdue</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">
                      {taskStatusLabel[task.status]} • {task.dueDate ?? 'No due date'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${taskStatusBadge[task.status] ?? 'bg-slate-700 text-slate-300'}`}>
                      {taskStatusLabel[task.status]}
                    </span>
                    <button
                      className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200"
                      onClick={() => {
                        setEditingTaskId(task.id);
                        setTaskCreateOpen(true);
                        setTaskForm({ title: task.title, status: task.status, dueDate: task.dueDate ?? '' });
                        setDeletingTaskId(null);
                      }}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default TasksTab;
