import { useState } from 'react';
import { getApiBase } from '../../lib/api';
import type { BudgetLineItem, Category, ExpenseItem } from '../../types/projects';

const API_BASE = getApiBase();
const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
const errorClass = 'ring-1 ring-red-500/60 border border-red-500/60';

type Props = {
  expenses:     ExpenseItem[];
  setExpenses:  React.Dispatch<React.SetStateAction<ExpenseItem[]>>;
  lineItems:    BudgetLineItem[];
  vendors:      { id: string; name: string }[];
  categories:   Category[];
  projectId:    string;
  token:        string;
};

const ExpensesTab = ({ expenses, setExpenses, lineItems, vendors, categories, projectId, token }: Props) => {
  const [expenseCreateOpen,      setExpenseCreateOpen]      = useState(false);
  const [expenseSubmitAttempted, setExpenseSubmitAttempted] = useState(false);
  const [editingExpenseId,       setEditingExpenseId]       = useState<string | null>(null);
  const [expenseForm,            setExpenseForm]            = useState({ vendorId: '', description: '', amount: '', categoryId: '', expenseDate: '', lineItemId: '' });
  const [expenseError,           setExpenseError]           = useState<string | null>(null);
  const [deletingExpenseId,      setDeletingExpenseId]      = useState<string | null>(null);

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
    const url    = editingExpenseId ? `${API_BASE}/expenses/${editingExpenseId}` : `${API_BASE}/projects/${projectId}/expenses`;
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vendorId:    expenseForm.vendorId,
        description: expenseForm.description.trim(),
        amount:      Number(expenseForm.amount),
        categoryId:  expenseForm.categoryId,
        expenseDate: expenseForm.expenseDate,
        lineItemId:  expenseForm.lineItemId || undefined,
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

  const totalSpend = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
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

        {/* Expense form */}
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
                {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
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
                min="0" step="0.01"
                className={`rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800 ${expenseSubmitAttempted && !expenseForm.amount ? errorClass : ''}`}
              />
              <select
                value={expenseForm.categoryId}
                onChange={(e) => setExpenseForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                className={`rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800 ${expenseSubmitAttempted && !expenseForm.categoryId ? errorClass : ''}`}
              >
                <option value="">Select category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select
                value={expenseForm.lineItemId}
                onChange={(e) => setExpenseForm((prev) => ({ ...prev, lineItemId: e.target.value }))}
                className="rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800"
              >
                <option value="">No line item (optional)</option>
                {lineItems.map((li) => <option key={li.id} value={li.id}>{li.description}</option>)}
              </select>
              <input
                type="date"
                value={expenseForm.expenseDate}
                onChange={(e) => setExpenseForm((prev) => ({ ...prev, expenseDate: e.target.value }))}
                className={`rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800 ${expenseSubmitAttempted && !expenseForm.expenseDate ? errorClass : ''}`}
              />
            </div>
            <div className="mt-5 flex items-center gap-4">
              <button className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-slate-950" onClick={handleExpenseSubmit}>
                {editingExpenseId ? 'Update Expense' : 'Add Expense'}
              </button>
              {editingExpenseId && (
                <div className="ml-auto">
                  {deletingExpenseId === editingExpenseId ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Are you sure?</span>
                      <button className="text-xs text-red-300" onClick={() => handleExpenseDelete(editingExpenseId)}>Confirm</button>
                      <button className="text-xs text-slate-400" onClick={() => setDeletingExpenseId(null)}>Cancel</button>
                    </div>
                  ) : (
                    <button className="text-xs text-red-400 hover:text-red-300" onClick={() => setDeletingExpenseId(editingExpenseId)}>
                      Delete expense
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Expense list */}
        <div className="mt-4">
          {expenses.length === 0 ? (
            <div className="text-sm text-slate-400">No expenses yet.</div>
          ) : (
            <>
              <div className="divide-y divide-slate-800 text-sm">
                {expenses.map((expense) => {
                  const categoryName  = categories.find((c) => c.id === expense.categoryId)?.name ?? expense.categoryId;
                  const vendorName    = vendors.find((v) => v.id === expense.vendorId)?.name ?? expense.vendorId;
                  const lineItemDesc  = expense.lineItemId ? lineItems.find((li) => li.id === expense.lineItemId)?.description : undefined;
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
                          onClick={() => {
                            setEditingExpenseId(expense.id);
                            setExpenseCreateOpen(true);
                            setExpenseForm({ vendorId: expense.vendorId, description: expense.description, amount: expense.amount.toString(), categoryId: expense.categoryId, expenseDate: expense.expenseDate, lineItemId: expense.lineItemId ?? '' });
                            setDeletingExpenseId(null);
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex justify-end border-t border-slate-800 pt-4">
                <div className="text-sm text-slate-400">
                  Total: <span className="font-semibold text-slate-100">{fmt.format(totalSpend)}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpensesTab;
