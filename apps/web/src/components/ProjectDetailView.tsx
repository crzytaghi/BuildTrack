import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiBase } from '../lib/api';
import type { BudgetLineItem, Category, ExpenseItem, ProjectItem, QuoteItem, TaskItem } from '../types/projects';

const API_BASE = getApiBase();

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });

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

type Props = {
  projectId: string;
  token: string;
  deletingProjectId: string | null;
  onRequestDeleteProject: (id: string | null) => void;
  onDeleteProject: (id: string) => void;
};

const ProjectDetailView = ({ projectId, token, deletingProjectId, onRequestDeleteProject, onDeleteProject }: Props) => {
  // — core data —
  const [project, setProject] = useState<ProjectItem | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [lineItems, setLineItems] = useState<BudgetLineItem[]>([]);
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [vendors, setVendors] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // — project edit —
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

  // — tabs —
  const [activeTab, setActiveTab] = useState<'overview' | 'budget' | 'tasks' | 'expenses'>('overview');

  // — tasks (project-scoped) —
  const [taskStatusFilter, setTaskStatusFilter] = useState('');
  const [taskCreateOpen, setTaskCreateOpen] = useState(false);
  const [taskSubmitAttempted, setTaskSubmitAttempted] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState<{ title: string; status: TaskItem['status'] | ''; dueDate: string }>({ title: '', status: '', dueDate: '' });
  const [taskError, setTaskError] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  // — expenses (project-scoped) —
  const [expenseCreateOpen, setExpenseCreateOpen] = useState(false);
  const [expenseSubmitAttempted, setExpenseSubmitAttempted] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expenseForm, setExpenseForm] = useState({ vendorId: '', description: '', amount: '', categoryId: '', expenseDate: '', lineItemId: '' });
  const [expenseError, setExpenseError] = useState<string | null>(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);

  // — budget: line items —
  const [selectedLineItemId, setSelectedLineItemId] = useState<string | null>(null);
  const [lineItemCreateOpen, setLineItemCreateOpen] = useState(false);
  const [lineItemSubmitAttempted, setLineItemSubmitAttempted] = useState(false);
  const [editingLineItemId, setEditingLineItemId] = useState<string | null>(null);
  const [lineItemForm, setLineItemForm] = useState({ categoryId: '', description: '', budgetedAmount: '', notes: '' });
  const [lineItemsError, setLineItemsError] = useState<string | null>(null);
  const [deletingLineItemId, setDeletingLineItemId] = useState<string | null>(null);

  // — budget: quotes —
  const [quoteCreateOpen, setQuoteCreateOpen] = useState(false);
  const [quoteSubmitAttempted, setQuoteSubmitAttempted] = useState(false);
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [quoteForm, setQuoteForm] = useState({ vendorId: '', amount: '', description: '', expiresAt: '', submittedAt: '' });
  const [deletingQuoteId, setDeletingQuoteId] = useState<string | null>(null);
  const [expandedQuoteId, setExpandedQuoteId] = useState<string | null>(null);

  // — initial load —
  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [projectRes, tasksRes, expensesRes, lineItemsRes, vendorsRes, categoriesRes, quotesRes] = await Promise.all([
          fetch(`${API_BASE}/projects/${projectId}`, { headers }),
          fetch(`${API_BASE}/projects/${projectId}/tasks`, { headers }),
          fetch(`${API_BASE}/projects/${projectId}/expenses`, { headers }),
          fetch(`${API_BASE}/projects/${projectId}/budget-line-items`, { headers }),
          fetch(`${API_BASE}/vendors`, { headers }),
          fetch(`${API_BASE}/categories`, { headers }),
          fetch(`${API_BASE}/projects/${projectId}/quotes`, { headers }),
        ]);

        if (!projectRes.ok) throw new Error('Unable to load project');

        const projectData = (await projectRes.json()) as { data: ProjectItem };
        const tasksData = (await tasksRes.json()) as { data: TaskItem[] };
        const expensesData = (await expensesRes.json()) as { data: ExpenseItem[] };
        const lineItemsData = (await lineItemsRes.json()) as { data: BudgetLineItem[] };
        const vendorsData = (await vendorsRes.json()) as { data: { id: string; name: string }[] };
        const categoriesData = (await categoriesRes.json()) as { data: Category[] };
        const quotesData = (await quotesRes.json()) as { data: QuoteItem[] };

        setProject(projectData.data);
        setTasks(tasksData.data);
        setExpenses(expensesData.data);
        setLineItems(lineItemsData.data);
        setVendors(vendorsData.data);
        setCategories(categoriesData.data);
        setQuotes(quotesData.data);
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

  // — project edit handlers —
  const handleSave = async () => {
    if (!project) return;
    if (!form.name.trim()) { setEditError('Project name is required'); return; }
    setSaving(true);
    setEditError(null);
    try {
      const res = await fetch(`${API_BASE}/projects/${project.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
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

  // — budget: line item handlers —
  const closeLineItemForm = () => {
    setLineItemCreateOpen(false);
    setEditingLineItemId(null);
    setLineItemSubmitAttempted(false);
    setLineItemForm({ categoryId: '', description: '', budgetedAmount: '', notes: '' });
    setLineItemsError(null);
  };

  const handleLineItemSubmit = async () => {
    setLineItemSubmitAttempted(true);
    if (!lineItemForm.categoryId || !lineItemForm.description.trim() || !lineItemForm.budgetedAmount) return;
    const method = editingLineItemId ? 'PATCH' : 'POST';
    const url = editingLineItemId
      ? `${API_BASE}/budget-line-items/${editingLineItemId}`
      : `${API_BASE}/projects/${projectId}/budget-line-items`;
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categoryId: lineItemForm.categoryId,
        description: lineItemForm.description.trim(),
        budgetedAmount: Number(lineItemForm.budgetedAmount),
        notes: lineItemForm.notes || undefined,
        projectId,
      }),
    });
    if (!res.ok) { setLineItemsError('Unable to save line item'); return; }
    const data = (await res.json()) as { data: BudgetLineItem };
    setLineItems((prev) =>
      editingLineItemId ? prev.map((li) => (li.id === data.data.id ? data.data : li)) : [data.data, ...prev]
    );
    closeLineItemForm();
  };

  const handleLineItemDelete = async (id: string) => {
    await fetch(`${API_BASE}/budget-line-items/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setLineItems((prev) => prev.filter((li) => li.id !== id));
    setQuotes((prev) => prev.filter((q) => q.lineItemId !== id));
    if (selectedLineItemId === id) setSelectedLineItemId(null);
    setDeletingLineItemId(null);
  };

  // — budget: quote handlers —
  const closeQuoteForm = () => {
    setQuoteCreateOpen(false);
    setEditingQuoteId(null);
    setQuoteSubmitAttempted(false);
    setQuoteForm({ vendorId: '', amount: '', description: '', expiresAt: '', submittedAt: '' });
  };

  const handleQuoteSubmit = async () => {
    setQuoteSubmitAttempted(true);
    if (!quoteForm.vendorId || !quoteForm.amount || !quoteForm.submittedAt) return;
    const method = editingQuoteId ? 'PATCH' : 'POST';
    const url = editingQuoteId
      ? `${API_BASE}/quotes/${editingQuoteId}`
      : `${API_BASE}/budget-line-items/${selectedLineItemId}/quotes`;
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vendorId: quoteForm.vendorId,
        amount: Number(quoteForm.amount),
        description: quoteForm.description || undefined,
        expiresAt: quoteForm.expiresAt || undefined,
        submittedAt: quoteForm.submittedAt,
      }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { data: QuoteItem };
    setQuotes((prev) =>
      editingQuoteId ? prev.map((q) => (q.id === data.data.id ? data.data : q)) : [data.data, ...prev]
    );
    closeQuoteForm();
  };

  const handleAwardQuote = async (quoteId: string) => {
    const res = await fetch(`${API_BASE}/quotes/${quoteId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'awarded' }),
    });
    if (!res.ok) return;
    const refreshRes = await fetch(`${API_BASE}/projects/${projectId}/quotes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (refreshRes.ok) {
      const data = (await refreshRes.json()) as { data: QuoteItem[] };
      setQuotes(data.data);
    }
  };

  const handleQuoteDelete = async (id: string) => {
    await fetch(`${API_BASE}/quotes/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setQuotes((prev) => prev.filter((q) => q.id !== id));
    setDeletingQuoteId(null);
  };

  // — task handlers —
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
    const url = editingTaskId
      ? `${API_BASE}/tasks/${editingTaskId}`
      : `${API_BASE}/projects/${projectId}/tasks`;
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

  // — expense handlers —
  const closeExpenseForm = () => {
    setExpenseCreateOpen(false);
    setEditingExpenseId(null);
    setExpenseSubmitAttempted(false);
    setExpenseForm({ vendorId: '', description: '', amount: '', categoryId: '', expenseDate: '', lineItemId: '' });
    setExpenseError(null);
  };

  const handleExpenseSubmit = async () => {
    setExpenseSubmitAttempted(true);
    if (!expenseForm.vendorId || !expenseForm.description.trim() || !expenseForm.amount || !expenseForm.categoryId || !expenseForm.expenseDate) return;
    const method = editingExpenseId ? 'PATCH' : 'POST';
    const url = editingExpenseId
      ? `${API_BASE}/expenses/${editingExpenseId}`
      : `${API_BASE}/projects/${projectId}/expenses`;
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vendorId: expenseForm.vendorId,
        description: expenseForm.description.trim(),
        amount: Number(expenseForm.amount),
        categoryId: expenseForm.categoryId,
        expenseDate: expenseForm.expenseDate,
        lineItemId: expenseForm.lineItemId || undefined,
        projectId,
      }),
    });
    if (!res.ok) { setExpenseError('Unable to save expense'); return; }
    const data = (await res.json()) as { data: ExpenseItem };
    setExpenses((prev) =>
      editingExpenseId ? prev.map((e) => (e.id === data.data.id ? data.data : e)) : [data.data, ...prev]
    );
    closeExpenseForm();
  };

  const handleExpenseDelete = async (id: string) => {
    await fetch(`${API_BASE}/expenses/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    setDeletingExpenseId(null);
  };

  if (loading) {
    return <div className="px-4 py-6 text-sm text-slate-400 sm:px-6 lg:px-8">Loading project...</div>;
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

  const today = new Date().toISOString().split('T')[0];
  const totalSpend = expenses.reduce((sum, e) => sum + e.amount, 0);
  const variance = (project.budgetTotal ?? 0) - totalSpend;
  const lineItemsTotal = lineItems.reduce((sum, li) => sum + li.budgetedAmount, 0);
  const awardedQuotesTotal = quotes.filter((q) => q.status === 'awarded').reduce((sum, q) => sum + q.amount, 0);
  const errorClass = 'ring-1 ring-red-500/60 border border-red-500/60';

  return (
    <>
      {/* Header */}
      <header className="flex flex-col gap-4 bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div>
          <Link to="/projects" className="text-xs uppercase tracking-wide text-slate-300 hover:text-white">
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
              <button className="text-xs text-slate-400" onClick={() => onRequestDeleteProject(null)}>
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

      {/* Tab bar */}
      <div className="flex border-b border-slate-800 px-4 sm:px-6 lg:px-8">
        {(['overview', 'budget', 'tasks', 'expenses'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${
              activeTab === tab
                ? 'border-accent text-accent'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <>
          <section className="grid grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:px-8">
            {/* Project Summary */}
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
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      className="mt-2 w-full rounded-xl bg-surface px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-slate-800 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wide text-slate-400">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as ProjectItem['status'] }))}
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
                      onChange={(e) => setForm((prev) => ({ ...prev, budgetTotal: e.target.value }))}
                      className="mt-2 w-full rounded-xl bg-surface px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-slate-800 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wide text-slate-400">Start Date</label>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                      className="mt-2 w-full rounded-xl bg-surface px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-slate-800 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wide text-slate-400">End Date</label>
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                      className="mt-2 w-full rounded-xl bg-surface px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-slate-800 focus:ring-accent"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs uppercase tracking-wide text-slate-400">Notes</label>
                    <input
                      value={form.notes}
                      onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                      className="mt-2 w-full rounded-xl bg-surface px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-slate-800 focus:ring-accent"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Snapshot */}
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
            {/* Tasks */}
            <div className="rounded-2xl bg-panel p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-200">Tasks</div>
                <button
                  className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-slate-950"
                  onClick={() => setActiveTab('tasks')}
                >
                  View All Tasks
                </button>
              </div>
              <div className="mt-4 divide-y divide-slate-800 text-sm">
                {tasks.length === 0 ? (
                  <div className="text-slate-400">No tasks yet.</div>
                ) : (
                  tasks.map((task) => {
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
                          <div className="mt-0.5 text-xs text-slate-400">{task.dueDate ?? 'No due date'}</div>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${taskStatusBadge[task.status] ?? 'bg-slate-700 text-slate-300'}`}>
                          {taskStatusLabel[task.status] ?? task.status}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Expenses */}
            <div className="rounded-2xl bg-panel p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-200">Expenses</div>
                <button
                  className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-slate-950"
                  onClick={() => setActiveTab('expenses')}
                >
                  View All Expenses
                </button>
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
        </>
      )}

      {/* Budget tab */}
      {activeTab === 'budget' && (
        <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
          {/* Budget summary KPIs */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: 'Project Budget Total', value: project.budgetTotal ?? 0 },
              { label: 'Line Items Total', value: lineItemsTotal },
              { label: 'Awarded Quotes', value: awardedQuotesTotal },
              { label: 'Actual Spend', value: totalSpend },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-2xl bg-panel p-5 shadow-lg">
                <div className="text-xs text-slate-400">{label}</div>
                <div className="mt-2 text-xl font-semibold text-slate-100">{fmt.format(value)}</div>
              </div>
            ))}
          </div>

          {/* Line items */}
          <div className="rounded-2xl bg-panel p-6 shadow-lg">
            <div className="flex items-start justify-between">
              <div className="text-sm font-semibold text-slate-200">Line Items</div>
              {!lineItemCreateOpen && !editingLineItemId && (
                <button
                  className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-slate-950"
                  onClick={() => setLineItemCreateOpen(true)}
                >
                  Add Line Item
                </button>
              )}
            </div>

            {/* Line item form */}
            {(lineItemCreateOpen || editingLineItemId) && (
              <div className="mt-4 rounded-2xl border border-slate-800 bg-surface/60 p-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-200">
                    {editingLineItemId ? 'Edit Line Item' : 'New Line Item'}
                  </div>
                  <button className="text-xs uppercase tracking-wide text-slate-400" onClick={closeLineItemForm}>
                    Cancel
                  </button>
                </div>
                {lineItemsError && (
                  <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                    {lineItemsError}
                  </div>
                )}
                <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  <select
                    value={lineItemForm.categoryId}
                    onChange={(e) => setLineItemForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                    className={`rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800 ${lineItemSubmitAttempted && !lineItemForm.categoryId ? errorClass : ''}`}
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <input
                    value={lineItemForm.description}
                    onChange={(e) => setLineItemForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Description"
                    className={`rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800 ${lineItemSubmitAttempted && !lineItemForm.description.trim() ? errorClass : ''}`}
                  />
                  <input
                    type="number"
                    value={lineItemForm.budgetedAmount}
                    onChange={(e) => setLineItemForm((prev) => ({ ...prev, budgetedAmount: e.target.value }))}
                    placeholder="Budgeted Amount ($)"
                    min="0"
                    step="1"
                    className={`rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800 ${lineItemSubmitAttempted && !lineItemForm.budgetedAmount ? errorClass : ''}`}
                  />
                  <input
                    value={lineItemForm.notes}
                    onChange={(e) => setLineItemForm((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Notes (optional)"
                    className="rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800"
                  />
                </div>
                <button
                  className="mt-5 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-slate-950"
                  onClick={handleLineItemSubmit}
                >
                  {editingLineItemId ? 'Update Line Item' : 'Add Line Item'}
                </button>
              </div>
            )}

            {/* Line items list */}
            <div className="mt-4 text-sm">
              {lineItems.length === 0 ? (
                <div className="text-slate-400">No line items yet.</div>
              ) : (
                lineItems.map((item) => {
                  const categoryName = categories.find((c) => c.id === item.categoryId)?.name ?? item.categoryId;
                  const itemQuotes = quotes.filter((q) => q.lineItemId === item.id);
                  const isSelected = selectedLineItemId === item.id;
                  const spent = expenses.filter((e) => e.lineItemId === item.id).reduce((sum, e) => sum + e.amount, 0);
                  const pct = item.budgetedAmount > 0 ? Math.min((spent / item.budgetedAmount) * 100, 100) : 0;
                  const over = spent > item.budgetedAmount;
                  const remaining = item.budgetedAmount - spent;
                  return (
                    <div key={item.id} className="border-b border-slate-800 last:border-0">
                      {/* Row */}
                      <div className="flex items-start justify-between py-3">
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="font-medium text-slate-100">{item.description}</div>
                          <div className="text-xs text-slate-400">
                            {categoryName} • {fmt.format(item.budgetedAmount)}
                          </div>
                          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                            <div
                              className={`h-full rounded-full transition-all ${over ? 'bg-red-500' : 'bg-accent'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className={`mt-1 text-xs ${over ? 'text-red-400' : 'text-slate-500'}`}>
                            {fmt.format(spent)} spent
                            {over
                              ? ` — ${fmt.format(Math.abs(remaining))} over budget`
                              : ` — ${fmt.format(remaining)} remaining`}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              isSelected
                                ? 'bg-accent text-slate-950'
                                : 'border border-slate-700 text-slate-200'
                            }`}
                            onClick={() => {
                              setSelectedLineItemId(isSelected ? null : item.id);
                              closeQuoteForm();
                            }}
                          >
                            {itemQuotes.length} Quotes
                          </button>
                          {deletingLineItemId === item.id ? (
                            <>
                              <button
                                className="rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs text-red-300"
                                onClick={() => handleLineItemDelete(item.id)}
                              >
                                Confirm delete
                              </button>
                              <button
                                className="text-xs text-slate-400"
                                onClick={() => setDeletingLineItemId(null)}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200"
                                onClick={() => {
                                  setEditingLineItemId(item.id);
                                  setLineItemCreateOpen(true);
                                  setLineItemForm({
                                    categoryId: item.categoryId,
                                    description: item.description,
                                    budgetedAmount: item.budgetedAmount.toString(),
                                    notes: item.notes ?? '',
                                  });
                                }}
                              >
                                Edit
                              </button>
                              <button
                                className="rounded-full border border-red-900 px-3 py-1 text-xs text-red-400"
                                onClick={() => setDeletingLineItemId(item.id)}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Inline quotes expansion */}
                      {isSelected && (
                        <div className="mb-4 rounded-2xl border border-slate-700 bg-surface/40 p-4">
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Quotes</div>
                            {!quoteCreateOpen && (
                              <button
                                className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-slate-950"
                                onClick={() => { setQuoteCreateOpen(true); setEditingQuoteId(null); }}
                              >
                                Add Quote
                              </button>
                            )}
                          </div>

                          {/* Quote form */}
                          {quoteCreateOpen && (
                            <div className="mt-3 rounded-2xl border border-slate-800 bg-surface/60 p-4">
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-semibold text-slate-200">
                                  {editingQuoteId ? 'Edit Quote' : 'New Quote'}
                                </div>
                                <button className="text-xs uppercase tracking-wide text-slate-400" onClick={closeQuoteForm}>
                                  Cancel
                                </button>
                              </div>
                              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                <select
                                  value={quoteForm.vendorId}
                                  onChange={(e) => setQuoteForm((prev) => ({ ...prev, vendorId: e.target.value }))}
                                  className={`rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800 ${quoteSubmitAttempted && !quoteForm.vendorId ? errorClass : ''}`}
                                >
                                  <option value="">Select vendor</option>
                                  {vendors.map((v) => (
                                    <option key={v.id} value={v.id}>{v.name}</option>
                                  ))}
                                </select>
                                <input
                                  type="number"
                                  value={quoteForm.amount}
                                  onChange={(e) => setQuoteForm((prev) => ({ ...prev, amount: e.target.value }))}
                                  placeholder="Amount ($)"
                                  min="0"
                                  step="1"
                                  className={`rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800 ${quoteSubmitAttempted && !quoteForm.amount ? errorClass : ''}`}
                                />
                                <input
                                  value={quoteForm.description}
                                  onChange={(e) => setQuoteForm((prev) => ({ ...prev, description: e.target.value }))}
                                  placeholder="Description (optional)"
                                  className="rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800"
                                />
                                <div>
                                  <label className="mb-1 block text-xs text-slate-400">Submitted At</label>
                                  <input
                                    type="date"
                                    value={quoteForm.submittedAt}
                                    onChange={(e) => setQuoteForm((prev) => ({ ...prev, submittedAt: e.target.value }))}
                                    className={`w-full rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800 ${quoteSubmitAttempted && !quoteForm.submittedAt ? errorClass : ''}`}
                                  />
                                </div>
                                <div>
                                  <label className="mb-1 block text-xs text-slate-400">Expires At (optional)</label>
                                  <input
                                    type="date"
                                    value={quoteForm.expiresAt}
                                    onChange={(e) => setQuoteForm((prev) => ({ ...prev, expiresAt: e.target.value }))}
                                    className="w-full rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800"
                                  />
                                </div>
                              </div>
                              <button
                                className="mt-4 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-slate-950"
                                onClick={handleQuoteSubmit}
                              >
                                {editingQuoteId ? 'Update Quote' : 'Add Quote'}
                              </button>
                            </div>
                          )}

                          {/* Quotes list */}
                          <div className="mt-3 divide-y divide-slate-800">
                            {itemQuotes.length === 0 ? (
                              <div className="py-2 text-xs text-slate-500">No quotes yet.</div>
                            ) : (
                              itemQuotes.map((quote) => {
                                const vendorName = vendors.find((v) => v.id === quote.vendorId)?.name ?? quote.vendorId;
                                const statusColors = {
                                  awarded: 'bg-emerald-500/20 text-emerald-300',
                                  rejected: 'bg-red-500/20 text-red-300',
                                  pending: 'bg-slate-500/20 text-slate-300',
                                };
                                const isExpanded = expandedQuoteId === quote.id;
                                return (
                                  <div key={quote.id} className="py-3">
                                    <div
                                      className="flex cursor-pointer items-center justify-between"
                                      onClick={() => setExpandedQuoteId(isExpanded ? null : quote.id)}
                                    >
                                      <div>
                                        <div className="font-medium text-slate-100">{vendorName}</div>
                                        <div className="text-xs text-slate-400">{quote.submittedAt}</div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="text-sm font-semibold text-slate-100">{fmt.format(quote.amount)}</div>
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[quote.status]}`}>
                                          {quote.status}
                                        </span>
                                        {quote.status !== 'awarded' && (
                                          <button
                                            className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-slate-950"
                                            onClick={(e) => { e.stopPropagation(); handleAwardQuote(quote.id); }}
                                          >
                                            Award
                                          </button>
                                        )}
                                        {quote.status === 'pending' && (
                                          <button
                                            className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setEditingQuoteId(quote.id);
                                              setQuoteCreateOpen(true);
                                              setQuoteForm({
                                                vendorId: quote.vendorId,
                                                amount: quote.amount.toString(),
                                                description: quote.description ?? '',
                                                expiresAt: quote.expiresAt ?? '',
                                                submittedAt: quote.submittedAt,
                                              });
                                            }}
                                          >
                                            Edit
                                          </button>
                                        )}
                                        {deletingQuoteId === quote.id ? (
                                          <>
                                            <button
                                              className="rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs text-red-300"
                                              onClick={(e) => { e.stopPropagation(); handleQuoteDelete(quote.id); }}
                                            >
                                              Confirm delete
                                            </button>
                                            <button
                                              className="text-xs text-slate-400"
                                              onClick={(e) => { e.stopPropagation(); setDeletingQuoteId(null); }}
                                            >
                                              Cancel
                                            </button>
                                          </>
                                        ) : (
                                          <button
                                            className="rounded-full border border-red-900 px-3 py-1 text-xs text-red-400"
                                            onClick={(e) => { e.stopPropagation(); setDeletingQuoteId(quote.id); }}
                                          >
                                            Delete
                                          </button>
                                        )}
                                        <span className="text-xs text-slate-500">{isExpanded ? '▲' : '▼'}</span>
                                      </div>
                                    </div>
                                    {isExpanded && (
                                      <div className="mt-2 rounded-xl bg-surface/60 px-4 py-3 text-xs text-slate-300">
                                        <span className="font-semibold text-slate-400">Description: </span>
                                        {quote.description ?? 'None'}
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tasks tab */}
      {activeTab === 'tasks' && (
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
                <button
                  className="mt-5 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-slate-950"
                  onClick={handleTaskSubmit}
                >
                  {editingTaskId ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            )}

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

            <div className="mt-3 divide-y divide-slate-800 text-sm">
              {(() => {
                const filtered = tasks.filter((t) =>
                  !taskStatusFilter ||
                  (taskStatusFilter === 'overdue'
                    ? t.dueDate && t.dueDate < today && t.status !== 'done'
                    : t.status === taskStatusFilter)
                );
                return filtered.length === 0 ? (
                  <div className="text-slate-400">{tasks.length === 0 ? 'No tasks yet.' : 'No tasks match this filter.'}</div>
                ) : <>{filtered.map((task) => {
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
                      {deletingTaskId === task.id ? (
                        <>
                          <button
                            className="rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs text-red-300"
                            onClick={() => handleTaskDelete(task.id)}
                          >
                            Confirm delete
                          </button>
                          <button
                            className="text-xs text-slate-400"
                            onClick={() => setDeletingTaskId(null)}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200"
                            onClick={() => {
                              setEditingTaskId(task.id);
                              setTaskCreateOpen(true);
                              setTaskForm({ title: task.title, status: task.status, dueDate: task.dueDate ?? '' });
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="rounded-full border border-red-900 px-3 py-1 text-xs text-red-400"
                            onClick={() => setDeletingTaskId(task.id)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  );
                })}</>;
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Expenses tab */}
      {activeTab === 'expenses' && (
        <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
          <div className="rounded-2xl bg-panel p-6 shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-200">Expenses</div>
                <div className="text-xs text-slate-500">Record and track costs for this project.</div>
              </div>
              {!expenseCreateOpen && !editingExpenseId && (
                <button
                  className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-slate-950"
                  onClick={() => setExpenseCreateOpen(true)}
                >
                  Add Expense
                </button>
              )}
            </div>

            {(expenseCreateOpen || editingExpenseId) && (
              <div className="mt-4 rounded-2xl border border-slate-800 bg-surface/60 p-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-200">
                    {editingExpenseId ? 'Edit Expense' : 'New Expense'}
                  </div>
                  <button className="text-xs uppercase tracking-wide text-slate-400" onClick={closeExpenseForm}>
                    Cancel
                  </button>
                </div>
                {expenseError && (
                  <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                    {expenseError}
                  </div>
                )}
                <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  <select
                    value={expenseForm.vendorId}
                    onChange={(e) => setExpenseForm((prev) => ({ ...prev, vendorId: e.target.value }))}
                    className={`rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800 ${expenseSubmitAttempted && !expenseForm.vendorId ? errorClass : ''}`}
                  >
                    <option value="">Select vendor</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                  <input
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Description"
                    className={`rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800 ${expenseSubmitAttempted && !expenseForm.description.trim() ? errorClass : ''}`}
                  />
                  <input
                    type="number"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm((prev) => ({ ...prev, amount: e.target.value }))}
                    placeholder="Amount ($)"
                    min="0"
                    step="0.01"
                    className={`rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800 ${expenseSubmitAttempted && !expenseForm.amount ? errorClass : ''}`}
                  />
                  <select
                    value={expenseForm.categoryId}
                    onChange={(e) => setExpenseForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                    className={`rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800 ${expenseSubmitAttempted && !expenseForm.categoryId ? errorClass : ''}`}
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <select
                    value={expenseForm.lineItemId}
                    onChange={(e) => setExpenseForm((prev) => ({ ...prev, lineItemId: e.target.value }))}
                    className="rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800"
                  >
                    <option value="">No line item (optional)</option>
                    {lineItems.map((li) => (
                      <option key={li.id} value={li.id}>{li.description}</option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={expenseForm.expenseDate}
                    onChange={(e) => setExpenseForm((prev) => ({ ...prev, expenseDate: e.target.value }))}
                    className={`rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800 ${expenseSubmitAttempted && !expenseForm.expenseDate ? errorClass : ''}`}
                  />
                </div>
                <button
                  className="mt-5 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-slate-950"
                  onClick={handleExpenseSubmit}
                >
                  {editingExpenseId ? 'Update Expense' : 'Add Expense'}
                </button>
              </div>
            )}

            <div className="mt-4">
              {expenses.length === 0 ? (
                <div className="text-sm text-slate-400">No expenses yet.</div>
              ) : (
                <>
                  <div className="divide-y divide-slate-800 text-sm">
                    {expenses.map((expense) => {
                      const categoryName = categories.find((c) => c.id === expense.categoryId)?.name ?? expense.categoryId;
                      const vendorName = vendors.find((v) => v.id === expense.vendorId)?.name ?? expense.vendorId;
                      const lineItemDesc = expense.lineItemId
                        ? lineItems.find((li) => li.id === expense.lineItemId)?.description
                        : undefined;
                      return (
                        <div key={expense.id} className="flex items-center justify-between py-3">
                          <div>
                            <div className="font-medium text-slate-100">{vendorName}</div>
                            <div className="text-xs text-slate-400">
                              {expense.description} • {categoryName} • {expense.expenseDate}
                              {lineItemDesc && ` • ${lineItemDesc}`}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-sm font-semibold text-slate-100">
                              {fmt.format(expense.amount)}
                            </div>
                            <div className="flex items-center gap-2">
                              {deletingExpenseId === expense.id ? (
                                <>
                                  <button
                                    className="rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs text-red-300"
                                    onClick={() => handleExpenseDelete(expense.id)}
                                  >
                                    Confirm delete
                                  </button>
                                  <button
                                    className="text-xs text-slate-400"
                                    onClick={() => setDeletingExpenseId(null)}
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200"
                                    onClick={() => {
                                      setEditingExpenseId(expense.id);
                                      setExpenseCreateOpen(true);
                                      setExpenseForm({
                                        vendorId: expense.vendorId,
                                        description: expense.description,
                                        amount: expense.amount.toString(),
                                        categoryId: expense.categoryId,
                                        expenseDate: expense.expenseDate,
                                        lineItemId: expense.lineItemId ?? '',
                                      });
                                    }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="rounded-full border border-red-900 px-3 py-1 text-xs text-red-400"
                                    onClick={() => setDeletingExpenseId(expense.id)}
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 flex justify-end border-t border-slate-800 pt-4">
                    <div className="text-sm text-slate-400">
                      Total: <span className="font-semibold text-slate-100">{fmt.format(expenses.reduce((sum, e) => sum + e.amount, 0))}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectDetailView;
