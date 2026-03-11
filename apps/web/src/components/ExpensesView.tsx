import type { BudgetLineItem, Category, ExpenseFormState, ExpenseItem, ProjectItem, VendorItem } from '../types/projects';

type Props = {
  projects: ProjectItem[];
  expenses: ExpenseItem[];
  categories: Category[];
  vendors: VendorItem[];
  budgetLineItems: BudgetLineItem[];
  loading: boolean;
  error: string | null;
  filters: {
    projectId: string;
    categoryId: string;
    fromDate: string;
    toDate: string;
  };
  createOpen: boolean;
  submitAttempted: boolean;
  form: ExpenseFormState;
  editingExpenseId: string | null;
  deletingExpenseId: string | null;
  onFilterChange: (next: Props['filters']) => void;
  onFormChange: (next: ExpenseFormState) => void;
  onCreateExpense: () => void;
  onSubmit: () => void;
  onCancelEdit: () => void;
  onEditExpense: (expense: ExpenseItem) => void;
  onRequestDeleteExpense: (id: string | null) => void;
  onDeleteExpense: (id: string) => void;
};

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ExpensesView = ({
  projects,
  expenses,
  categories,
  vendors,
  budgetLineItems,
  loading,
  error,
  filters,
  createOpen,
  submitAttempted,
  form,
  editingExpenseId,
  deletingExpenseId,
  onFilterChange,
  onFormChange,
  onCreateExpense,
  onSubmit,
  onCancelEdit,
  onEditExpense,
  onRequestDeleteExpense,
  onDeleteExpense,
}: Props) => {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <>
      <header className="flex flex-col gap-4 bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div>
          <div className="text-2xl font-semibold font-display">Expenses</div>
          <div className="text-sm text-slate-400">Record and track project costs.</div>
        </div>
      </header>

      <section className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-panel p-6 shadow-lg">
          <div className="text-sm font-semibold text-slate-200">Filters</div>
          <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <select
              value={filters.projectId}
              onChange={(e) => onFilterChange({ ...filters, projectId: e.target.value })}
              className="rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800"
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <select
              value={filters.categoryId}
              onChange={(e) => onFilterChange({ ...filters, categoryId: e.target.value })}
              className="rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) => onFilterChange({ ...filters, fromDate: e.target.value })}
              className="rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800"
            />
            <input
              type="date"
              value={filters.toDate}
              onChange={(e) => onFilterChange({ ...filters, toDate: e.target.value })}
              className="rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800"
            />
          </div>
        </div>
      </section>

      <section className="px-4 pb-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-panel p-6 shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-200">Expense Log</div>
              <div className="text-xs text-slate-500">View and manage all recorded expenses.</div>
            </div>
            {!createOpen && (
              <button
                className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-slate-950"
                onClick={onCreateExpense}
              >
                Add Expense
              </button>
            )}
          </div>

          {createOpen && (
            <div className="mt-4 rounded-2xl border border-slate-800 bg-surface/60 p-5">
              {(() => {
                const missingProject = submitAttempted && !form.projectId;
                const missingVendor = submitAttempted && !form.vendorId;
                const missingDescription = submitAttempted && !form.description.trim();
                const missingAmount = submitAttempted && !form.amount;
                const missingCategory = submitAttempted && !form.categoryId;
                const missingDate = submitAttempted && !form.expenseDate;
                const errorClass = 'ring-1 ring-red-500/60 border border-red-500/60';
                return (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-slate-200">
                        {editingExpenseId ? 'Edit Expense' : 'New Expense'}
                      </div>
                      <button
                        className="text-xs uppercase tracking-wide text-slate-400"
                        onClick={onCancelEdit}
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
                      <select
                        value={form.projectId}
                        onChange={(e) => onFormChange({ ...form, projectId: e.target.value })}
                        className={`rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800 ${missingProject ? errorClass : ''}`}
                      >
                        <option value="">Select project</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <select
                        value={form.vendorId}
                        onChange={(e) => onFormChange({ ...form, vendorId: e.target.value })}
                        className={`rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800 ${missingVendor ? errorClass : ''}`}
                      >
                        <option value="">Select vendor</option>
                        {vendors.map((v) => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                      <input
                        value={form.description}
                        onChange={(e) => onFormChange({ ...form, description: e.target.value })}
                        placeholder="Description"
                        className={`rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800 ${missingDescription ? errorClass : ''}`}
                      />
                      <input
                        type="number"
                        value={form.amount}
                        onChange={(e) => onFormChange({ ...form, amount: e.target.value })}
                        placeholder="Amount ($)"
                        min="0"
                        step="0.01"
                        className={`rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800 ${missingAmount ? errorClass : ''}`}
                      />
                      <select
                        value={form.categoryId}
                        onChange={(e) => onFormChange({ ...form, categoryId: e.target.value })}
                        className={`rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800 ${missingCategory ? errorClass : ''}`}
                      >
                        <option value="">Select category</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <select
                        value={form.lineItemId}
                        onChange={(e) => onFormChange({ ...form, lineItemId: e.target.value })}
                        className="rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800"
                      >
                        <option value="">No line item (optional)</option>
                        {budgetLineItems
                          .filter((li) => !form.projectId || li.projectId === form.projectId)
                          .map((li) => (
                            <option key={li.id} value={li.id}>{li.description}</option>
                          ))}
                      </select>
                      <input
                        type="date"
                        value={form.expenseDate}
                        onChange={(e) => onFormChange({ ...form, expenseDate: e.target.value })}
                        className={`rounded-xl bg-surface px-4 py-3 text-slate-100 outline-none ring-1 ring-slate-800 ${missingDate ? errorClass : ''}`}
                      />
                    </div>
                    <button
                      className="mt-5 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-slate-950"
                      onClick={onSubmit}
                    >
                      {editingExpenseId ? 'Update Expense' : 'Add Expense'}
                    </button>
                  </>
                );
              })()}
            </div>
          )}

          <div className="mt-4">
            {loading ? (
              <div className="text-sm text-slate-400">Loading expenses...</div>
            ) : (
              <>
                <div className="divide-y divide-slate-800 text-sm">
                  {expenses.length === 0 ? (
                    <div className="text-slate-400">No expenses found.</div>
                  ) : (
                    expenses.map((expense) => {
                      const projectName = projects.find((p) => p.id === expense.projectId)?.name ?? 'Unknown';
                      const categoryName = categories.find((c) => c.id === expense.categoryId)?.name ?? expense.categoryId;
                      const vendorName = vendors.find((v) => v.id === expense.vendorId)?.name ?? expense.vendorId;
                      const lineItemDesc = expense.lineItemId
                        ? budgetLineItems.find((li) => li.id === expense.lineItemId)?.description
                        : undefined;
                      return (
                        <div key={expense.id} className="flex items-center justify-between py-3">
                          <div>
                            <div className="font-medium text-slate-100">{vendorName}</div>
                            <div className="text-xs text-slate-400">
                              {expense.description} • {projectName} • {categoryName} • {expense.expenseDate}
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
                                    onClick={() => onDeleteExpense(expense.id)}
                                  >
                                    Confirm delete
                                  </button>
                                  <button
                                    className="text-xs text-slate-400"
                                    onClick={() => onRequestDeleteExpense(null)}
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200"
                                    onClick={() => onEditExpense(expense)}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="rounded-full border border-red-900 px-3 py-1 text-xs text-red-400"
                                    onClick={() => onRequestDeleteExpense(expense.id)}
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                {expenses.length > 0 && (
                  <div className="mt-4 flex justify-end border-t border-slate-800 pt-4">
                    <div className="text-sm text-slate-400">
                      Total: <span className="font-semibold text-slate-100">{fmt.format(total)}</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default ExpensesView;
