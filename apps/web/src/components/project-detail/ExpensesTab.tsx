import { useState } from 'react';
import { getApiBase } from '../../lib/api';
import type { BudgetLineItem, Category, ExpenseItem } from '../../types/projects';

const API_BASE = getApiBase();
const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
const errorClass = 'ring-1 ring-red-500/60 border border-red-500/60';

type ExpenseForm = { vendorId: string; description: string; amount: string; categoryId: string; expenseDate: string; lineItemId: string };
const emptyForm: ExpenseForm = { vendorId: '', description: '', amount: '', categoryId: '', expenseDate: '', lineItemId: '' };

type FormProps = {
  form:               ExpenseForm;
  setForm:            React.Dispatch<React.SetStateAction<ExpenseForm>>;
  submitAttempted:    boolean;
  error:              string | null;
  isEditing:          boolean;
  deletingId:         string | null;
  vendors:            { id: string; name: string }[];
  categories:         Category[];
  lineItems:          BudgetLineItem[];
  onSubmit:           () => void;
  onCancel:           () => void;
  onRequestDelete:    () => void;
  onCancelDelete:     () => void;
  onConfirmDelete:    () => void;
};

const ExpenseForm = ({ form, setForm, submitAttempted, error, isEditing, deletingId, vendors, categories, lineItems, onSubmit, onCancel, onRequestDelete, onCancelDelete, onConfirmDelete }: FormProps) => (
  <div className="rounded-2xl border border-slate-800 bg-surface/60 p-5">
    <div className="flex items-center justify-between">
      <div className="text-sm font-semibold text-slate-200">{isEditing ? 'Edit Expense' : 'New Expense'}</div>
      <button className="text-xs uppercase tracking-wide text-slate-400" onClick={onCancel}>Cancel</button>
    </div>
    {error && (
      <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>
    )}
    <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
      <select
        value={form.vendorId}
        onChange={(e) => setForm((p) => ({ ...p, vendorId: e.target.value }))}
        className={`rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800 ${submitAttempted && !form.vendorId ? errorClass : ''}`}
      >
        <option value="">Select vendor</option>
        {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
      </select>
      <input
        value={form.description}
        onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
        placeholder="Description"
        className={`rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800 ${submitAttempted && !form.description.trim() ? errorClass : ''}`}
      />
      <input
        type="number"
        value={form.amount}
        onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
        placeholder="Amount ($)"
        min="0" step="0.01"
        className={`rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800 ${submitAttempted && !form.amount ? errorClass : ''}`}
      />
      <select
        value={form.categoryId}
        onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))}
        className={`rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800 ${submitAttempted && !form.categoryId ? errorClass : ''}`}
      >
        <option value="">Select category</option>
        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <select
        value={form.lineItemId}
        onChange={(e) => setForm((p) => ({ ...p, lineItemId: e.target.value }))}
        className="rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800"
      >
        <option value="">No line item (optional)</option>
        {lineItems.map((li) => <option key={li.id} value={li.id}>{li.description}</option>)}
      </select>
      <input
        type="date"
        value={form.expenseDate}
        onChange={(e) => setForm((p) => ({ ...p, expenseDate: e.target.value }))}
        className={`rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800 ${submitAttempted && !form.expenseDate ? errorClass : ''}`}
      />
    </div>
    <div className="mt-5 flex items-center gap-4">
      <button className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-slate-950" onClick={onSubmit}>
        {isEditing ? 'Update Expense' : 'Add Expense'}
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
              Delete expense
            </button>
          )}
        </div>
      )}
    </div>
  </div>
);

type Props = {
  expenses:    ExpenseItem[];
  setExpenses: React.Dispatch<React.SetStateAction<ExpenseItem[]>>;
  lineItems:   BudgetLineItem[];
  vendors:     { id: string; name: string }[];
  categories:  Category[];
  projectId:   string;
  token:       string;
};

const ExpensesTab = ({ expenses, setExpenses, lineItems, vendors, categories, projectId, token }: Props) => {
  const [createOpen,       setCreateOpen]       = useState(false);
  const [submitAttempted,  setSubmitAttempted]  = useState(false);
  const [editingId,        setEditingId]        = useState<string | null>(null);
  const [form,             setForm]             = useState<ExpenseForm>(emptyForm);
  const [error,            setError]            = useState<string | null>(null);
  const [deletingId,       setDeletingId]       = useState<string | null>(null);

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
    if (!form.vendorId || !form.description.trim() || !form.amount || !form.categoryId || !form.expenseDate) return;
    const method = editingId ? 'PATCH' : 'POST';
    const url    = editingId ? `${API_BASE}/expenses/${editingId}` : `${API_BASE}/projects/${projectId}/expenses`;
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vendorId:    form.vendorId,
        description: form.description.trim(),
        amount:      Number(form.amount),
        categoryId:  form.categoryId,
        expenseDate: form.expenseDate,
        lineItemId:  form.lineItemId || undefined,
        projectId,
      }),
    });
    if (!res.ok) { setError('Unable to save expense'); return; }
    const data = (await res.json()) as { data: ExpenseItem };
    setExpenses((prev) =>
      editingId ? prev.map((e) => (e.id === data.data.id ? data.data : e)) : [data.data, ...prev]
    );
    closeForm();
  };

  const handleDelete = async (id: string) => {
    await fetch(`${API_BASE}/expenses/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    closeForm();
  };

  const openEdit = (expense: ExpenseItem) => {
    setEditingId(expense.id);
    setCreateOpen(false);
    setSubmitAttempted(false);
    setForm({ vendorId: expense.vendorId, description: expense.description, amount: expense.amount.toString(), categoryId: expense.categoryId, expenseDate: expense.expenseDate, lineItemId: expense.lineItemId ?? '' });
    setError(null);
    setDeletingId(null);
  };

  const totalSpend = expenses.reduce((sum, e) => sum + e.amount, 0);

  const sharedFormProps = {
    form, setForm, submitAttempted, error,
    vendors, categories, lineItems,
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
            <div className="text-sm font-semibold text-slate-200">Expenses</div>
            <div className="text-xs text-slate-500">Record and track costs for this project.</div>
          </div>
          {!createOpen && !editingId && (
            <button
              className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-slate-950"
              onClick={() => { setCreateOpen(true); setEditingId(null); }}
            >
              Add Expense
            </button>
          )}
        </div>

        {/* New expense form — top of list */}
        {createOpen && !editingId && (
          <div className="mt-4">
            <ExpenseForm {...sharedFormProps} isEditing={false} deletingId={null} />
          </div>
        )}

        {/* Expense list */}
        <div className="mt-4">
          {expenses.length === 0 && !createOpen ? (
            <div className="text-sm text-slate-400">No expenses yet.</div>
          ) : (
            <>
              <div className="divide-y divide-slate-800 text-sm">
                {expenses.map((expense) => {
                  if (editingId === expense.id) {
                    return (
                      <div key={expense.id} className="py-3">
                        <ExpenseForm
                          {...sharedFormProps}
                          isEditing={true}
                          deletingId={deletingId}
                        />
                      </div>
                    );
                  }
                  const categoryName = categories.find((c) => c.id === expense.categoryId)?.name ?? expense.categoryId;
                  const vendorName   = vendors.find((v) => v.id === expense.vendorId)?.name ?? expense.vendorId;
                  const lineItemDesc = expense.lineItemId ? lineItems.find((li) => li.id === expense.lineItemId)?.description : undefined;
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
                        <div className="text-sm font-semibold text-slate-100">{fmt.format(expense.amount)}</div>
                        <button
                          className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200"
                          onClick={() => openEdit(expense)}
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {expenses.length > 0 && (
                <div className="mt-4 flex justify-end border-t border-slate-800 pt-4">
                  <div className="text-sm text-slate-400">
                    Total: <span className="font-semibold text-slate-100">{fmt.format(totalSpend)}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpensesTab;
