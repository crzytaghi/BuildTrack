import type { ExpenseItem, ProjectItem, TaskItem } from '../../types/projects';

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });

const taskStatusBadge: Record<string, string> = {
  todo:        'bg-slate-700 text-slate-300',
  in_progress: 'bg-sky-900 text-sky-300',
  blocked:     'bg-red-900/50 text-red-300',
  done:        'bg-emerald-900/50 text-emerald-300',
};
const taskStatusLabel: Record<string, string> = {
  todo: 'To Do', in_progress: 'In Progress', blocked: 'Blocked', done: 'Done',
};

type TabType = 'overview' | 'budget' | 'tasks' | 'expenses' | 'documents' | 'settings';

type Props = {
  project:          ProjectItem;
  tasks:            TaskItem[];
  expenses:         ExpenseItem[];
  vendors:          { id: string; name: string }[];
  totalSpend:       number;
  variance:         number;
  onNavigateToTab:  (tab: TabType) => void;
};

const OverviewTab = ({ project, tasks, expenses, vendors, totalSpend, variance, onNavigateToTab }: Props) => {
  const today = new Date().toISOString().split('T')[0];

  return (
    <>
      <section className="grid grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:px-8">
        {/* Project Summary */}
        <div className="rounded-2xl bg-panel p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-200">Project Summary</div>
            <button
              className="text-xs text-slate-400 hover:text-slate-200"
              onClick={() => onNavigateToTab('settings')}
            >
              Edit in Settings →
            </button>
          </div>
          <div className="mt-4 space-y-2 text-sm text-slate-300">
            <div>Start Date: {project.startDate ?? 'Not set'}</div>
            <div>End Date: {project.endDate ?? 'Not set'}</div>
            <div>Budget Total: {project.budgetTotal ? fmt.format(project.budgetTotal) : 'Not set'}</div>
            <div>Notes: {project.notes || 'None'}</div>
          </div>
        </div>

        {/* Snapshot KPIs */}
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
        {/* Tasks preview */}
        <div className="rounded-2xl bg-panel p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-200">Tasks</div>
            <button
              className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-slate-950"
              onClick={() => onNavigateToTab('tasks')}
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

        {/* Expenses preview */}
        <div className="rounded-2xl bg-panel p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-200">Expenses</div>
            <button
              className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-slate-950"
              onClick={() => onNavigateToTab('expenses')}
            >
              View All Expenses
            </button>
          </div>
          <div className="mt-4 divide-y divide-slate-800 text-sm">
            {expenses.length === 0 ? (
              <div className="text-slate-400">No expenses yet.</div>
            ) : (
              expenses.slice(0, 8).map((expense) => (
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
  );
};

export default OverviewTab;
