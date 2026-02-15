import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiBase } from '../lib/api';
import type { ExpenseItem, ProjectItem, TaskItem } from '../types/projects';

const API_BASE = getApiBase();

type Props = {
  projectId: string;
  token: string;
  onLogout: () => void;
};

const ProjectDetailView = ({ projectId, token, onLogout }: Props) => {
  const [project, setProject] = useState<ProjectItem | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    status: 'planning' as ProjectItem['status'],
    startDate: '',
    endDate: '',
    budgetTotal: '',
    notes: '',
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [projectRes, tasksRes, expensesRes] = await Promise.all([
          fetch(`${API_BASE}/projects/${projectId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/projects/${projectId}/tasks`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/projects/${projectId}/expenses`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!projectRes.ok) throw new Error('Unable to load project');

        const projectData = (await projectRes.json()) as { data: ProjectItem };
        const tasksData = (await tasksRes.json()) as { data: TaskItem[] };
        const expensesData = (await expensesRes.json()) as { data: ExpenseItem[] };

        setProject(projectData.data);
        setTasks(tasksData.data);
        setExpenses(expensesData.data);
        setForm({
          name: projectData.data.name,
          status: projectData.data.status,
          startDate: projectData.data.startDate ?? '',
          endDate: projectData.data.endDate ?? '',
          budgetTotal: projectData.data.budgetTotal?.toString() ?? '',
          notes: projectData.data.notes ?? '',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load project');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [projectId, token]);

  const handleSave = async () => {
    if (!project) return;
    if (!form.name.trim()) {
      setEditError('Project name is required');
      return;
    }
    setSaving(true);
    setEditError(null);
    try {
      const res = await fetch(`${API_BASE}/projects/${project.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name.trim(),
          status: form.status,
          startDate: form.startDate || undefined,
          endDate: form.endDate || undefined,
          budgetTotal: form.budgetTotal ? Number(form.budgetTotal) : undefined,
          notes: form.notes || undefined,
        }),
      });
      if (!res.ok) throw new Error('Unable to save project');
      const data = (await res.json()) as { data: ProjectItem };
      setProject(data.data);
      setIsEditing(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Unable to save project');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!project) return;
    setForm({
      name: project.name,
      status: project.status,
      startDate: project.startDate ?? '',
      endDate: project.endDate ?? '',
      budgetTotal: project.budgetTotal?.toString() ?? '',
      notes: project.notes ?? '',
    });
    setEditError(null);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="px-8 py-6 text-sm text-slate-400">Loading project...</div>
    );
  }

  if (error || !project) {
    return (
      <div className="px-8 py-6">
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error ?? 'Project not found'}
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="flex items-center justify-between bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-6">
        <div>
          <Link
            to="/projects"
            className="text-xs uppercase tracking-wide text-slate-300 hover:text-white"
          >
            ← Back to Projects
          </Link>
          <div className="text-2xl font-semibold font-display">{project.name}</div>
          <div className="text-sm text-slate-400">Status: {project.status}</div>
        </div>
        <button
          className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200"
          onClick={onLogout}
        >
          Log out
        </button>
      </header>

      <section className="grid grid-cols-[1.2fr_1fr] gap-6 px-8 py-6">
        <div className="rounded-2xl bg-panel p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-200">Project Summary</div>
            <div className="flex items-center gap-2 text-xs">
              {!isEditing ? (
                <button
                  className="rounded-full border border-slate-700 px-3 py-1 text-slate-200"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </button>
              ) : (
                <>
                  <button
                    className="rounded-full border border-slate-700 px-3 py-1 text-slate-200"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    className="rounded-full bg-accent px-3 py-1 text-slate-950"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </>
              )}
            </div>
          </div>
          {editError && (
            <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {editError}
            </div>
          )}
          {!isEditing ? (
            <div className="mt-4 space-y-2 text-sm text-slate-300">
              <div>Start Date: {project.startDate ?? 'Not set'}</div>
              <div>End Date: {project.endDate ?? 'Not set'}</div>
              <div>Budget Total: {project.budgetTotal ? `$${project.budgetTotal}` : 'Not set'}</div>
              <div>Notes: {project.notes || 'None'}</div>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div className="col-span-2">
                <label className="text-xs uppercase tracking-wide text-slate-400">Project Name</label>
                <input
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="mt-2 w-full rounded-xl bg-surface px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-slate-800 focus:ring-accent"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-slate-400">Status</label>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      status: event.target.value as ProjectItem['status'],
                    }))
                  }
                  className="mt-2 w-full rounded-xl bg-surface px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-slate-800 focus:ring-accent"
                >
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="on_hold">On hold</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-slate-400">Budget Total</label>
                <input
                  type="number"
                  value={form.budgetTotal}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, budgetTotal: event.target.value }))
                  }
                  className="mt-2 w-full rounded-xl bg-surface px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-slate-800 focus:ring-accent"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-slate-400">Start Date</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, startDate: event.target.value }))
                  }
                  className="mt-2 w-full rounded-xl bg-surface px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-slate-800 focus:ring-accent"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-slate-400">End Date</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, endDate: event.target.value }))
                  }
                  className="mt-2 w-full rounded-xl bg-surface px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-slate-800 focus:ring-accent"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs uppercase tracking-wide text-slate-400">Notes</label>
                <input
                  value={form.notes}
                  onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                  className="mt-2 w-full rounded-xl bg-surface px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-slate-800 focus:ring-accent"
                />
              </div>
            </div>
          )}
        </div>
        <div className="rounded-2xl bg-panel p-6 shadow-lg">
          <div className="text-sm font-semibold text-slate-200">Snapshot</div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-surface px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-slate-400">Tasks</div>
              <div className="mt-1 text-lg font-semibold text-slate-100">{tasks.length}</div>
            </div>
            <div className="rounded-xl bg-surface px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-slate-400">Expenses</div>
              <div className="mt-1 text-lg font-semibold text-slate-100">{expenses.length}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-[1fr_1fr] gap-6 px-8 pb-8">
        <div className="rounded-2xl bg-panel p-6 shadow-lg">
          <div className="text-sm font-semibold text-slate-200">Tasks</div>
          <div className="mt-4 divide-y divide-slate-800 text-sm">
            {tasks.length === 0 ? (
              <div className="text-slate-400">No tasks yet.</div>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="py-3">
                  <div className="font-medium text-slate-100">{task.title}</div>
                  <div className="text-xs text-slate-400">
                    {task.status} • {task.dueDate ?? 'No due date'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-panel p-6 shadow-lg">
          <div className="text-sm font-semibold text-slate-200">Expenses</div>
          <div className="mt-4 divide-y divide-slate-800 text-sm">
            {expenses.length === 0 ? (
              <div className="text-slate-400">No expenses yet.</div>
            ) : (
              expenses.map((expense) => (
                <div key={expense.id} className="py-3">
                  <div className="font-medium text-slate-100">
                    {expense.description ?? expense.categoryId}
                  </div>
                  <div className="text-xs text-slate-400">
                    {expense.expenseDate} • ${expense.amount}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-[1fr_1fr] gap-6 px-8 pb-12">
        <div className="rounded-2xl bg-panel p-6 shadow-lg">
          <div className="text-sm font-semibold text-slate-200">Budget (Coming Soon)</div>
          <div className="mt-3 text-sm text-slate-400">
            Will load from `/projects/:id/budget-items` when available.
          </div>
        </div>
        <div className="rounded-2xl bg-panel p-6 shadow-lg">
          <div className="text-sm font-semibold text-slate-200">Documents (Coming Soon)</div>
          <div className="mt-3 text-sm text-slate-400">
            Will load from `/projects/:id/documents` when available.
          </div>
        </div>
      </section>
    </>
  );
};

export default ProjectDetailView;
