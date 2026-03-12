import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiBase } from '../lib/api';
import type { BudgetLineItem, ExpenseItem, ProjectItem, TaskItem } from '../types/projects';

const API_BASE = getApiBase();

type Props = {
  projectId: string;
  token: string;
  deletingProjectId: string | null;
  onRequestDeleteProject: (id: string | null) => void;
  onDeleteProject: (id: string) => void;
};

const taskStatusBadge: Record<string, string> = {
  todo: 'bg-slate-700 text-slate-300',
  in_progress: 'bg-sky-900 text-sky-300',
  blocked: 'bg-red-900/50 text-red-300',
  done: 'bg-emerald-900/50 text-emerald-300',
};
const taskStatusLabel: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  done: 'Done',
};

const projectStatusBadge: Record<string, string> = {
  planning: 'bg-slate-700 text-slate-300',
  active: 'bg-sky-900 text-sky-300',
  on_hold: 'bg-amber-900/50 text-amber-300',
  completed: 'bg-emerald-900/50 text-emerald-300',
};
const projectStatusLabel: Record<string, string> = {
  planning: 'Planning',
  active: 'Active',
  on_hold: 'On Hold',
  completed: 'Completed',
};

const ProjectDetailView = ({ projectId, token, deletingProjectId, onRequestDeleteProject, onDeleteProject }: Props) => {
  const [project, setProject] = useState<ProjectItem | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [lineItems, setLineItems] = useState<BudgetLineItem[]>([]);
  const [vendors, setVendors] = useState<{ id: string; name: string }[]>([]);
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
        const [projectRes, tasksRes, expensesRes, lineItemsRes, vendorsRes] = await Promise.all([
          fetch(`${API_BASE}/projects/${projectId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/projects/${projectId}/tasks`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/projects/${projectId}/expenses`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/projects/${projectId}/budget-line-items`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/vendors`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!projectRes.ok) throw new Error('Unable to load project');

        const projectData = (await projectRes.json()) as { data: ProjectItem };
        const tasksData = (await tasksRes.json()) as { data: TaskItem[] };
        const expensesData = (await expensesRes.json()) as { data: ExpenseItem[] };
        const lineItemsData = (await lineItemsRes.json()) as { data: BudgetLineItem[] };
        const vendorsData = (await vendorsRes.json()) as { data: { id: string; name: string }[] };

        setProject(projectData.data);
        setTasks(tasksData.data);
        setExpenses(expensesData.data);
        setLineItems(lineItemsData.data);
        setVendors(vendorsData.data);
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
      <div className="px-4 py-6 text-sm text-slate-400 sm:px-6 lg:px-8">Loading project...</div>
    );
  }

  if (error || !project) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error ?? 'Project not found'}
        </div>
      </div>
    );
  }

  const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const totalSpend = expenses.reduce((sum, e) => sum + e.amount, 0);
  const variance = (project.budgetTotal ?? 0) - totalSpend;

  return (
    <>
      <header className="flex flex-col gap-4 bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div>
          <Link
            to="/projects"
            className="text-xs uppercase tracking-wide text-slate-300 hover:text-white"
          >
            ← Back to Projects
          </Link>
          <div className="text-2xl font-semibold font-display">{project.name}</div>
          <div className="mt-1">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${projectStatusBadge[project.status] ?? 'bg-slate-700 text-slate-300'}`}>
              {projectStatusLabel[project.status] ?? project.status}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {deletingProjectId === project.id ? (
            <>
              <button
                className="rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs text-red-300"
                onClick={() => onDeleteProject(project.id)}
              >
                Confirm delete
              </button>
              <button
                className="text-xs text-slate-400"
                onClick={() => onRequestDeleteProject(null)}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              className="rounded-full border border-red-900 px-3 py-1 text-xs text-red-400"
              onClick={() => onRequestDeleteProject(project.id)}
            >
              Delete Project
            </button>
          )}
        </div>
      </header>

      <section className="grid grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:px-8">
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
              <div>Budget Total: {project.budgetTotal ? fmt.format(project.budgetTotal) : 'Not set'}</div>
              <div>Notes: {project.notes || 'None'}</div>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
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
            <div className="rounded-xl bg-violet-400/10 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-violet-300">Tasks</div>
              <div className="mt-1 text-lg font-semibold text-slate-100">{tasks.length}</div>
            </div>
            <div className="rounded-xl bg-amber-400/10 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-amber-300">Total Spend</div>
              <div className="mt-1 text-lg font-semibold text-slate-100">{fmt.format(totalSpend)}</div>
            </div>
            <div className="rounded-xl bg-emerald-400/10 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-emerald-300">Budget</div>
              <div className="mt-1 text-lg font-semibold text-slate-100">{fmt.format(project.budgetTotal ?? 0)}</div>
            </div>
            <div className={`rounded-xl px-4 py-3 ${variance >= 0 ? 'bg-sky-400/10' : 'bg-red-400/10'}`}>
              <div className={`text-xs uppercase tracking-wide ${variance >= 0 ? 'text-sky-300' : 'text-red-300'}`}>Variance</div>
              <div className="mt-1 text-lg font-semibold text-slate-100">{fmt.format(variance)}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 px-4 pb-8 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-8">
        <div className="rounded-2xl bg-panel p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-200">Tasks</div>
            <Link
              to={`/tasks?projectId=${project.id}`}
              className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-slate-950"
            >
              View Project Tasks
            </Link>
          </div>
          <div className="mt-4 divide-y divide-slate-800 text-sm">
            {tasks.length === 0 ? (
              <div className="text-slate-400">No tasks yet.</div>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-100">{task.title}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${taskStatusBadge[task.status] ?? 'bg-slate-700 text-slate-300'}`}>
                      {taskStatusLabel[task.status] ?? task.status}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-slate-400">
                    {task.dueDate ?? 'No due date'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-panel p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-200">Expenses</div>
            <Link
              to={`/expenses?projectId=${project.id}`}
              className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-slate-950"
            >
              View Project Expenses
            </Link>
          </div>
          <div className="mt-4 divide-y divide-slate-800 text-sm">
            {expenses.length === 0 ? (
              <div className="text-slate-400">No expenses yet.</div>
            ) : (
              expenses.map((expense) => (
                <div key={expense.id} className="py-3">
                  <div className="font-medium text-slate-100">
                    {vendors.find((v) => v.id === expense.vendorId)?.name ?? '—'}
                  </div>
                  <div className="text-xs text-slate-400">
                    {expense.description ?? expense.categoryId} • {expense.expenseDate} • {fmt.format(expense.amount)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="px-4 pb-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-panel p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-200">Budget Line Items</div>
            <Link
              to={`/budget?projectId=${project.id}`}
              className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-slate-950"
            >
              View Budget
            </Link>
          </div>
          <div className="mt-4 divide-y divide-slate-800 text-sm">
            {lineItems.length === 0 ? (
              <div className="text-slate-400">No line items yet.</div>
            ) : (
              lineItems.map((item) => {
                const spent = expenses
                  .filter((e) => e.lineItemId === item.id)
                  .reduce((sum, e) => sum + e.amount, 0);
                const pct = Math.min((spent / item.budgetedAmount) * 100, 100);
                const over = spent > item.budgetedAmount;
                const remaining = item.budgetedAmount - spent;
                return (
                  <div key={item.id} className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-slate-100">{item.description}</div>
                      <div className="text-xs text-slate-400">
                        {fmt.format(spent)} / {fmt.format(item.budgetedAmount)}
                      </div>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={`h-full rounded-full transition-all ${over ? 'bg-red-500' : 'bg-accent'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className={`mt-1 text-xs ${over ? 'text-red-400' : 'text-slate-500'}`}>
                      {over
                        ? `${fmt.format(Math.abs(remaining))} over budget`
                        : `${fmt.format(remaining)} remaining`}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default ProjectDetailView;
