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

type TaskForm = { title: string; status: TaskItem['status'] | ''; dueDate: string };
const emptyForm: TaskForm = { title: '', status: '', dueDate: '' };

type FormProps = {
  form:            TaskForm;
  setForm:         React.Dispatch<React.SetStateAction<TaskForm>>;
  submitAttempted: boolean;
  error:           string | null;
  isEditing:       boolean;
  deletingId:      string | null;
  onSubmit:        () => void;
  onCancel:        () => void;
  onRequestDelete: () => void;
  onCancelDelete:  () => void;
  onConfirmDelete: () => void;
};

const TaskForm = ({ form, setForm, submitAttempted, error, isEditing, deletingId, onSubmit, onCancel, onRequestDelete, onCancelDelete, onConfirmDelete }: FormProps) => (
  <div className="rounded-2xl border border-slate-800 bg-surface/60 p-5">
    <div className="flex items-center justify-between">
      <div className="text-sm font-semibold text-slate-200">{isEditing ? 'Edit Task' : 'New Task'}</div>
      <button className="text-xs uppercase tracking-wide text-slate-400" onClick={onCancel}>Cancel</button>
    </div>
    {error && (
      <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>
    )}
    <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
      <input
        value={form.title}
        onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
        placeholder="Task title"
        className={`rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800 ${submitAttempted && !form.title.trim() ? errorClass : ''}`}
      />
      <select
        value={form.status}
        onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as TaskItem['status'] | '' }))}
        className={`rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800 ${submitAttempted && !form.status ? errorClass : ''}`}
      >
        <option value="">Select status</option>
        {(['todo', 'in_progress', 'blocked', 'done'] as const).map((s) => (
          <option key={s} value={s}>{taskStatusLabel[s]}</option>
        ))}
      </select>
      <input
        type="date"
        value={form.dueDate}
        onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
        className={`rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800 ${submitAttempted && !form.dueDate ? errorClass : ''}`}
      />
    </div>
    <div className="mt-5 flex items-center gap-4">
      <button className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-slate-950" onClick={onSubmit}>
        {isEditing ? 'Update Task' : 'Create Task'}
      </button>
      {isEditing && (
        <div className="ml-auto">
          {deletingId ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Are you sure?</span>
              <button className="text-xs text-red-300" onClick={onConfirmDelete}>Confirm</button>
              <button className="text-xs text-slate-400" onClick={onCancelDelete}>Cancel</button>
            </div>
          ) : (
            <button className="text-xs text-red-400 hover:text-red-300" onClick={onRequestDelete}>
              Delete task
            </button>
          )}
        </div>
      )}
    </div>
  </div>
);

type Props = {
  tasks:     TaskItem[];
  setTasks:  React.Dispatch<React.SetStateAction<TaskItem[]>>;
  projectId: string;
  token:     string;
};

const TasksTab = ({ tasks, setTasks, projectId, token }: Props) => {
  const today = new Date().toISOString().split('T')[0];

  const [statusFilter,    setStatusFilter]    = useState('');
  const [createOpen,      setCreateOpen]      = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [editingId,       setEditingId]       = useState<string | null>(null);
  const [form,            setForm]            = useState<TaskForm>(emptyForm);
  const [error,           setError]           = useState<string | null>(null);
  const [deletingId,      setDeletingId]      = useState<string | null>(null);

  const closeForm = () => {
    setCreateOpen(false);
    setEditingId(null);
    setSubmitAttempted(false);
    setForm(emptyForm);
    setError(null);
    setDeletingId(null);
  };

  const handleSubmit = async () => {
    setSubmitAttempted(true);
    if (!form.title.trim() || !form.status || !form.dueDate) return;
    const method = editingId ? 'PATCH' : 'POST';
    const url    = editingId ? `${API_BASE}/tasks/${editingId}` : `${API_BASE}/projects/${projectId}/tasks`;
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: form.title.trim(), status: form.status, dueDate: form.dueDate, projectId }),
    });
    if (!res.ok) { setError('Unable to save task'); return; }
    const data = (await res.json()) as { data: TaskItem };
    setTasks((prev) =>
      editingId ? prev.map((t) => (t.id === data.data.id ? data.data : t)) : [data.data, ...prev]
    );
    closeForm();
  };

  const handleDelete = async (id: string) => {
    await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setTasks((prev) => prev.filter((t) => t.id !== id));
    closeForm();
  };

  const openEdit = (task: TaskItem) => {
    setEditingId(task.id);
    setCreateOpen(false);
    setSubmitAttempted(false);
    setForm({ title: task.title, status: task.status, dueDate: task.dueDate ?? '' });
    setError(null);
    setDeletingId(null);
  };

  // When the filter changes, close any open edit form to avoid hiding it
  const handleFilterChange = (value: string) => {
    closeForm();
    setStatusFilter(value);
  };

  const filtered = tasks.filter((t) =>
    !statusFilter ||
    (statusFilter === 'overdue'
      ? t.dueDate && t.dueDate < today && t.status !== 'done'
      : t.status === statusFilter)
  );

  // Always include the task being edited, even if it doesn't match the filter
  const visible = editingId && !filtered.find((t) => t.id === editingId)
    ? [...filtered, tasks.find((t) => t.id === editingId)!]
    : filtered;

  const sharedFormProps = {
    form, setForm, submitAttempted, error,
    onSubmit: handleSubmit,
    onCancel: closeForm,
    onRequestDelete: () => setDeletingId(editingId),
    onCancelDelete:  () => setDeletingId(null),
    onConfirmDelete: () => editingId && handleDelete(editingId),
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <div className="rounded-2xl bg-panel p-6 shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-200">Tasks</div>
            <div className="text-xs text-slate-500">Manage tasks for this project.</div>
          </div>
          {!createOpen && !editingId && (
            <button
              className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-slate-950"
              onClick={() => setCreateOpen(true)}
            >
              Create Task
            </button>
          )}
        </div>

        {/* New task form — top of list */}
        {createOpen && !editingId && (
          <div className="mt-4">
            <TaskForm {...sharedFormProps} isEditing={false} deletingId={null} />
          </div>
        )}

        {/* Filter */}
        <div className="mt-4">
          <select
            value={statusFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
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
          {visible.length === 0 ? (
            <div className="text-slate-400">{tasks.length === 0 ? 'No tasks yet.' : 'No tasks match this filter.'}</div>
          ) : (
            visible.map((task) => {
              if (editingId === task.id) {
                return (
                  <div key={task.id} className="py-3">
                    <TaskForm {...sharedFormProps} isEditing={true} deletingId={deletingId} />
                  </div>
                );
              }
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
                      onClick={() => openEdit(task)}
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
