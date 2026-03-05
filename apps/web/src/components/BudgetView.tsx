import { useState } from 'react';
import type {
  BudgetLineItem,
  BudgetLineItemFormState,
  Category,
  ExpenseItem,
  ProjectItem,
  QuoteFormState,
  QuoteItem,
  VendorItem,
} from '../types/projects';

type Props = {
  projects: ProjectItem[];
  lineItems: BudgetLineItem[];
  quotes: QuoteItem[];
  categories: Category[];
  vendors: VendorItem[];
  expenses: ExpenseItem[];
  loading: boolean;
  error: string | null;
  selectedProjectId: string;
  selectedLineItemId: string | null;
  lineItemForm: BudgetLineItemFormState;
  lineItemCreateOpen: boolean;
  lineItemSubmitAttempted: boolean;
  editingLineItemId: string | null;
  quoteForm: QuoteFormState;
  quoteCreateOpen: boolean;
  quoteSubmitAttempted: boolean;
  editingQuoteId: string | null;
  onProjectFilterChange: (projectId: string) => void;
  onSelectLineItem: (id: string | null) => void;
  onLineItemFormChange: (next: BudgetLineItemFormState) => void;
  onCreateLineItem: () => void;
  onLineItemSubmit: () => void;
  onLineItemCancelEdit: () => void;
  onEditLineItem: (item: BudgetLineItem) => void;
  onQuoteFormChange: (next: QuoteFormState) => void;
  onCreateQuote: () => void;
  onQuoteSubmit: () => void;
  onQuoteCancelEdit: () => void;
  onAwardQuote: (quoteId: string) => void;
  onEditQuote: (quote: QuoteItem) => void;
  onLogout: () => void;
};

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });

const BudgetView = ({
  projects,
  lineItems,
  quotes,
  categories,
  vendors,
  expenses,
  loading,
  error,
  selectedProjectId,
  selectedLineItemId,
  lineItemForm,
  lineItemCreateOpen,
  lineItemSubmitAttempted,
  editingLineItemId,
  quoteForm,
  quoteCreateOpen,
  quoteSubmitAttempted,
  editingQuoteId,
  onProjectFilterChange,
  onSelectLineItem,
  onLineItemFormChange,
  onCreateLineItem,
  onLineItemSubmit,
  onLineItemCancelEdit,
  onEditLineItem,
  onQuoteFormChange,
  onCreateQuote,
  onQuoteSubmit,
  onQuoteCancelEdit,
  onAwardQuote,
  onEditQuote,
  onLogout,
}: Props) => {
  const [expandedQuoteId, setExpandedQuoteId] = useState<string | null>(null);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const filteredLineItems = selectedProjectId
    ? lineItems.filter((li) => li.projectId === selectedProjectId)
    : lineItems;

  const filteredQuotes = selectedProjectId
    ? quotes.filter((q) => q.projectId === selectedProjectId)
    : quotes;

  const projectBudgetTotal = selectedProject?.budgetTotal ?? 0;
  const lineItemsTotal = filteredLineItems.reduce((sum, li) => sum + li.budgetedAmount, 0);
  const awardedQuotesTotal = filteredQuotes
    .filter((q) => q.status === 'awarded')
    .reduce((sum, q) => sum + q.amount, 0);
  const actualSpend = expenses
    .filter((e) => e.lineItemId && (!selectedProjectId || e.projectId === selectedProjectId))
    .reduce((sum, e) => sum + e.amount, 0);

  const selectedLineItem = lineItems.find((li) => li.id === selectedLineItemId) ?? null;
  const lineItemQuotes = selectedLineItemId
    ? quotes.filter((q) => q.lineItemId === selectedLineItemId)
    : [];

  const errorClass = 'ring-1 ring-red-500/60 border border-red-500/60';

  return (
    <>
      <header className="flex flex-col gap-4 bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div>
          <div className="text-2xl font-semibold font-display">Budget</div>
          <div className="text-sm text-slate-400">Track budgets, quotes, and actual spend by line item.</div>
        </div>
        <button
          className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200"
          onClick={onLogout}
        >
          Log out
        </button>
      </header>

      {/* Project filter */}
      <section className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-panel p-6 shadow-lg">
          <div className="text-sm font-semibold text-slate-200">Project</div>
          <div className="mt-4">
            <select
              value={selectedProjectId}
              onChange={(e) => onProjectFilterChange(e.target.value)}
              className="rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800 w-full sm:w-auto"
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Summary cards */}
      <section className="px-4 pb-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: 'Project Budget Total', value: projectBudgetTotal },
            { label: 'Line Items Total', value: lineItemsTotal },
            { label: 'Awarded Quotes', value: awardedQuotesTotal },
            { label: 'Actual Spend', value: actualSpend },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-2xl bg-panel p-5 shadow-lg">
              <div className="text-xs text-slate-400">{label}</div>
              <div className="mt-2 text-xl font-semibold text-slate-100">{fmt.format(value)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Line Items panel */}
      <section className="px-4 pb-6 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-panel p-6 shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-200">Line Items</div>
            </div>
            {!lineItemCreateOpen && (
              <button
                className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-slate-950"
                onClick={onCreateLineItem}
              >
                Add Line Item
              </button>
            )}
          </div>

          {lineItemCreateOpen && (
            <div className="mt-4 rounded-2xl border border-slate-800 bg-surface/60 p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-200">
                  {editingLineItemId ? 'Edit Line Item' : 'New Line Item'}
                </div>
                <button
                  className="text-xs uppercase tracking-wide text-slate-400"
                  onClick={onLineItemCancelEdit}
                >
                  Cancel
                </button>
              </div>
              {error && (
                <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {error}
                </div>
              )}
              <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                {!editingLineItemId && (
                  <select
                    value={lineItemForm.projectId}
                    onChange={(e) => onLineItemFormChange({ ...lineItemForm, projectId: e.target.value })}
                    className={`rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800 ${lineItemSubmitAttempted && !lineItemForm.projectId ? errorClass : ''}`}
                  >
                    <option value="">Select project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                )}
                <select
                  value={lineItemForm.categoryId}
                  onChange={(e) => onLineItemFormChange({ ...lineItemForm, categoryId: e.target.value })}
                  className={`rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800 ${lineItemSubmitAttempted && !lineItemForm.categoryId ? errorClass : ''}`}
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <input
                  value={lineItemForm.description}
                  onChange={(e) => onLineItemFormChange({ ...lineItemForm, description: e.target.value })}
                  placeholder="Description"
                  className={`rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800 ${lineItemSubmitAttempted && !lineItemForm.description.trim() ? errorClass : ''}`}
                />
                <input
                  type="number"
                  value={lineItemForm.budgetedAmount}
                  onChange={(e) => onLineItemFormChange({ ...lineItemForm, budgetedAmount: e.target.value })}
                  placeholder="Budgeted Amount ($)"
                  min="0"
                  step="1"
                  className={`rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800 ${lineItemSubmitAttempted && !lineItemForm.budgetedAmount ? errorClass : ''}`}
                />
                <input
                  value={lineItemForm.notes}
                  onChange={(e) => onLineItemFormChange({ ...lineItemForm, notes: e.target.value })}
                  placeholder="Notes (optional)"
                  className="rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800"
                />
              </div>
              <button
                className="mt-5 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-slate-950"
                onClick={onLineItemSubmit}
              >
                {editingLineItemId ? 'Update Line Item' : 'Add Line Item'}
              </button>
            </div>
          )}

          <div className="mt-4">
            {loading ? (
              <div className="text-sm text-slate-400">Loading...</div>
            ) : (
              <div className="divide-y divide-slate-800 text-sm">
                {filteredLineItems.length === 0 ? (
                  <div className="text-slate-400">No line items found.</div>
                ) : (
                  filteredLineItems.map((item) => {
                    const categoryName = categories.find((c) => c.id === item.categoryId)?.name ?? item.categoryId;
                    const quoteCount = quotes.filter((q) => q.lineItemId === item.id).length;
                    const isSelected = selectedLineItemId === item.id;
                    return (
                      <div key={item.id} className="flex items-center justify-between py-3">
                        <div>
                          <div className="font-medium text-slate-100">{item.description}</div>
                          <div className="text-xs text-slate-400">
                            {categoryName} • {fmt.format(item.budgetedAmount)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              isSelected
                                ? 'bg-accent text-slate-950'
                                : 'border border-slate-700 text-slate-200'
                            }`}
                            onClick={() => onSelectLineItem(isSelected ? null : item.id)}
                          >
                            {quoteCount} Quotes
                          </button>
                          <button
                            className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200"
                            onClick={() => onEditLineItem(item)}
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Quotes panel */}
      {selectedLineItemId && selectedLineItem && (
        <section className="px-4 pb-8 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-panel p-6 shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-200">
                  Quotes for: {selectedLineItem.description}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!quoteCreateOpen && (
                  <button
                    className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-slate-950"
                    onClick={onCreateQuote}
                  >
                    Add Quote
                  </button>
                )}
                <button
                  className="rounded-full border border-slate-700 px-3 py-2 text-xs text-slate-200"
                  onClick={() => onSelectLineItem(null)}
                >
                  ×
                </button>
              </div>
            </div>

            {quoteCreateOpen && (
              <div className="mt-4 rounded-2xl border border-slate-800 bg-surface/60 p-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-200">
                    {editingQuoteId ? 'Edit Quote' : 'New Quote'}
                  </div>
                  <button
                    className="text-xs uppercase tracking-wide text-slate-400"
                    onClick={onQuoteCancelEdit}
                  >
                    Cancel
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  <select
                    value={quoteForm.vendorId}
                    onChange={(e) => onQuoteFormChange({ ...quoteForm, vendorId: e.target.value })}
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
                    onChange={(e) => onQuoteFormChange({ ...quoteForm, amount: e.target.value })}
                    placeholder="Amount ($)"
                    min="0"
                    step="1"
                    className={`rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800 ${quoteSubmitAttempted && !quoteForm.amount ? errorClass : ''}`}
                  />
                  <input
                    value={quoteForm.description}
                    onChange={(e) => onQuoteFormChange({ ...quoteForm, description: e.target.value })}
                    placeholder="Description (optional)"
                    className="rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800"
                  />
                  <div>
                    <label className="mb-1 block text-xs text-slate-400">Submitted At</label>
                    <input
                      type="date"
                      value={quoteForm.submittedAt}
                      onChange={(e) => onQuoteFormChange({ ...quoteForm, submittedAt: e.target.value })}
                      className={`w-full rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800 ${quoteSubmitAttempted && !quoteForm.submittedAt ? errorClass : ''}`}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-400">Expires At (optional)</label>
                    <input
                      type="date"
                      value={quoteForm.expiresAt}
                      onChange={(e) => onQuoteFormChange({ ...quoteForm, expiresAt: e.target.value })}
                      className="w-full rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800"
                    />
                  </div>
                </div>
                <button
                  className="mt-5 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-slate-950"
                  onClick={onQuoteSubmit}
                >
                  {editingQuoteId ? 'Update Quote' : 'Add Quote'}
                </button>
              </div>
            )}

            <div className="mt-4">
              <div className="divide-y divide-slate-800 text-sm">
                {lineItemQuotes.length === 0 ? (
                  <div className="text-slate-400">No quotes for this line item.</div>
                ) : (
                  lineItemQuotes.map((quote) => {
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
                                onClick={(e) => { e.stopPropagation(); onAwardQuote(quote.id); }}
                              >
                                Award
                              </button>
                            )}
                            {quote.status === 'pending' && (
                              <button
                                className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200"
                                onClick={(e) => { e.stopPropagation(); onEditQuote(quote); }}
                              >
                                Edit
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
          </div>
        </section>
      )}
    </>
  );
};

export default BudgetView;
