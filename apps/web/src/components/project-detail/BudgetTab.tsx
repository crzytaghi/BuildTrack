import { useState } from 'react';
import { getApiBase } from '../../lib/api';
import type { BudgetLineItem, Category, ExpenseItem, ProjectItem, QuoteItem } from '../../types/projects';

const API_BASE = getApiBase();
const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
const errorClass = 'ring-1 ring-red-500/60 border border-red-500/60';

type Props = {
  project:          ProjectItem;
  lineItems:        BudgetLineItem[];
  setLineItems:     React.Dispatch<React.SetStateAction<BudgetLineItem[]>>;
  quotes:           QuoteItem[];
  setQuotes:        React.Dispatch<React.SetStateAction<QuoteItem[]>>;
  expenses:         ExpenseItem[];
  vendors:          { id: string; name: string }[];
  categories:       Category[];
  token:            string;
  projectId:        string;
};

const BudgetTab = ({ project, lineItems, setLineItems, quotes, setQuotes, expenses, vendors, categories, token, projectId }: Props) => {
  // Line item form state
  const [selectedLineItemId,     setSelectedLineItemId]     = useState<string | null>(null);
  const [lineItemCreateOpen,     setLineItemCreateOpen]     = useState(false);
  const [lineItemSubmitAttempted, setLineItemSubmitAttempted] = useState(false);
  const [editingLineItemId,      setEditingLineItemId]      = useState<string | null>(null);
  const [lineItemForm,           setLineItemForm]           = useState({ categoryId: '', description: '', budgetedAmount: '', notes: '' });
  const [lineItemsError,         setLineItemsError]         = useState<string | null>(null);
  const [deletingLineItemId,     setDeletingLineItemId]     = useState<string | null>(null);

  // Quote form state
  const [quoteCreateOpen,      setQuoteCreateOpen]      = useState(false);
  const [quoteSubmitAttempted, setQuoteSubmitAttempted] = useState(false);
  const [editingQuoteId,       setEditingQuoteId]       = useState<string | null>(null);
  const [quoteForm,            setQuoteForm]            = useState({ vendorId: '', amount: '', description: '', expiresAt: '', submittedAt: '' });
  const [deletingQuoteId,      setDeletingQuoteId]      = useState<string | null>(null);
  const [expandedQuoteId,      setExpandedQuoteId]      = useState<string | null>(null);

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
      body: JSON.stringify({ categoryId: lineItemForm.categoryId, description: lineItemForm.description.trim(), budgetedAmount: Number(lineItemForm.budgetedAmount), notes: lineItemForm.notes || undefined, projectId }),
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
      body: JSON.stringify({ vendorId: quoteForm.vendorId, amount: Number(quoteForm.amount), description: quoteForm.description || undefined, expiresAt: quoteForm.expiresAt || undefined, submittedAt: quoteForm.submittedAt }),
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
    const refreshRes = await fetch(`${API_BASE}/projects/${projectId}/quotes`, { headers: { Authorization: `Bearer ${token}` } });
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

  const totalSpend       = expenses.reduce((sum, e) => sum + e.amount, 0);
  const lineItemsTotal   = lineItems.reduce((sum, li) => sum + li.budgetedAmount, 0);
  const awardedQuotesTotal = quotes.filter((q) => q.status === 'awarded').reduce((sum, q) => sum + q.amount, 0);

  const quoteStatusColors: Record<string, string> = {
    awarded: 'bg-emerald-500/20 text-emerald-300',
    rejected: 'bg-red-500/20 text-red-300',
    pending: 'bg-slate-500/20 text-slate-300',
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Project Budget Total', value: project.budgetTotal ?? 0 },
          { label: 'Line Items Total',      value: lineItemsTotal },
          { label: 'Awarded Quotes',        value: awardedQuotesTotal },
          { label: 'Actual Spend',          value: totalSpend },
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
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
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
                min="0" step="1"
                className={`rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800 ${lineItemSubmitAttempted && !lineItemForm.budgetedAmount ? errorClass : ''}`}
              />
              <input
                value={lineItemForm.notes}
                onChange={(e) => setLineItemForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Notes (optional)"
                className="rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800"
              />
            </div>
            <div className="mt-5 flex items-center gap-4">
              <button className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-slate-950" onClick={handleLineItemSubmit}>
                {editingLineItemId ? 'Update Line Item' : 'Add Line Item'}
              </button>
              {editingLineItemId && (
                <div className="ml-auto">
                  {deletingLineItemId === editingLineItemId ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Are you sure?</span>
                      <button className="text-xs text-red-300" onClick={() => handleLineItemDelete(editingLineItemId)}>Confirm</button>
                      <button className="text-xs text-slate-400" onClick={() => setDeletingLineItemId(null)}>Cancel</button>
                    </div>
                  ) : (
                    <button className="text-xs text-red-400 hover:text-red-300" onClick={() => setDeletingLineItemId(editingLineItemId)}>
                      Delete line item
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Line items list */}
        <div className="mt-4 text-sm">
          {lineItems.length === 0 ? (
            <div className="text-slate-400">No line items yet.</div>
          ) : (
            lineItems.map((item) => {
              const categoryName = categories.find((c) => c.id === item.categoryId)?.name ?? item.categoryId;
              const itemQuotes   = quotes.filter((q) => q.lineItemId === item.id);
              const isSelected   = selectedLineItemId === item.id;
              const spent        = expenses.filter((e) => e.lineItemId === item.id).reduce((sum, e) => sum + e.amount, 0);
              const pct          = item.budgetedAmount > 0 ? Math.min((spent / item.budgetedAmount) * 100, 100) : 0;
              const over         = spent > item.budgetedAmount;
              const remaining    = item.budgetedAmount - spent;

              return (
                <div key={item.id} className="border-b border-slate-800 last:border-0">
                  <div className="flex items-start justify-between py-3">
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="font-medium text-slate-100">{item.description}</div>
                      <div className="text-xs text-slate-400">{categoryName} • {fmt.format(item.budgetedAmount)}</div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                        <div className={`h-full rounded-full transition-all ${over ? 'bg-red-500' : 'bg-accent'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className={`mt-1 text-xs ${over ? 'text-red-400' : 'text-slate-500'}`}>
                        {fmt.format(spent)} spent
                        {over ? ` — ${fmt.format(Math.abs(remaining))} over budget` : ` — ${fmt.format(remaining)} remaining`}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${isSelected ? 'bg-accent text-slate-950' : 'border border-slate-700 text-slate-200'}`}
                        onClick={() => { setSelectedLineItemId(isSelected ? null : item.id); closeQuoteForm(); }}
                      >
                        {itemQuotes.length} Quotes
                      </button>
                      <button
                        className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200"
                        onClick={() => {
                          setEditingLineItemId(item.id);
                          setLineItemCreateOpen(true);
                          setLineItemForm({ categoryId: item.categoryId, description: item.description, budgetedAmount: item.budgetedAmount.toString(), notes: item.notes ?? '' });
                          setDeletingLineItemId(null);
                        }}
                      >
                        Edit
                      </button>
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
                              {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                            <input
                              type="number"
                              value={quoteForm.amount}
                              onChange={(e) => setQuoteForm((prev) => ({ ...prev, amount: e.target.value }))}
                              placeholder="Amount ($)"
                              min="0" step="1"
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
                                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${quoteStatusColors[quote.status] ?? quoteStatusColors.pending}`}>
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
                                          setQuoteForm({ vendorId: quote.vendorId, amount: quote.amount.toString(), description: quote.description ?? '', expiresAt: quote.expiresAt ?? '', submittedAt: quote.submittedAt });
                                        }}
                                      >
                                        Edit
                                      </button>
                                    )}
                                    <span className="text-xs text-slate-500">{isExpanded ? '▲' : '▼'}</span>
                                  </div>
                                </div>
                                {isExpanded && (
                                  <div className="mt-2 rounded-xl bg-surface/60 px-4 py-3 text-xs text-slate-300">
                                    <span className="font-semibold text-slate-400">Description: </span>{quote.description ?? 'None'}
                                    <div className="mt-3 flex justify-end">
                                      {deletingQuoteId === quote.id ? (
                                        <div className="flex items-center gap-2">
                                          <span className="text-slate-400">Are you sure?</span>
                                          <button className="text-red-300" onClick={() => handleQuoteDelete(quote.id)}>Confirm</button>
                                          <button className="text-slate-400" onClick={() => setDeletingQuoteId(null)}>Cancel</button>
                                        </div>
                                      ) : (
                                        <button className="text-red-400 hover:text-red-300" onClick={() => setDeletingQuoteId(quote.id)}>
                                          Delete quote
                                        </button>
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
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default BudgetTab;
