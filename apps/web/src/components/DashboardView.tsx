import type { ReactNode } from "react";

type Kpi = { label: string; value: string; tone: string };
type TaskDueSoon = { id: string; title: string; dueDate?: string; projectName: string };
type RecentExpense = { id: string; vendorName: string; projectName: string; amount: number; expenseDate: string };
type ProjectSpend = { name: string; budget: number; actual: number };

type Props = {
  userName: string;
  companyName: string;
  kpis: Kpi[];
  tasksDueSoon: TaskDueSoon[];
  recentExpenses: RecentExpense[];
  projectSpendData: ProjectSpend[];
  headerActions?: ReactNode;
};

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtAxis = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 });

const DashboardView = ({ userName, companyName, kpis, tasksDueSoon, recentExpenses, projectSpendData, headerActions }: Props) => {
  const maxVal = Math.max(...projectSpendData.flatMap((p) => [p.budget, p.actual]), 1);

  return (
    <>
      <header className="flex flex-col gap-4 bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div>
          <div className="text-2xl font-semibold font-display">{companyName}</div>
          <div className="text-sm text-slate-400">Welcome back, {userName}.</div>
        </div>
        <div className="flex items-center gap-3">{headerActions}</div>
      </header>
      <section className="grid grid-cols-1 gap-6 px-4 py-6 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-2xl bg-surface p-5 shadow-lg">
            <div className="text-xs uppercase tracking-wide text-slate-400">{kpi.label}</div>
            <div className="mt-3 text-2xl font-semibold">{kpi.value}</div>
            <div className={`mt-4 h-2 w-16 rounded-full ${kpi.tone}`} />
          </div>
        ))}
      </section>
      <section className="grid grid-cols-1 gap-6 px-4 sm:px-6 lg:grid-cols-[2fr_1fr] lg:px-8">
        <div className="rounded-2xl bg-panel p-6 shadow-lg">
          <div className="text-sm font-semibold text-slate-200">Budget vs Actual</div>
          {projectSpendData.length === 0 ? (
            <div className="mt-4 flex h-48 items-center justify-center text-sm text-slate-500">No project budget data yet.</div>
          ) : (
            <div className="mt-4 flex gap-3">
              {/* Y-axis */}
              <div className="flex w-12 flex-shrink-0 flex-col justify-between" style={{ height: '160px' }}>
                <span className="text-right text-xs leading-none text-slate-500">{fmtAxis.format(maxVal)}</span>
                <span className="text-right text-xs leading-none text-slate-500">{fmtAxis.format(maxVal / 2)}</span>
                <span className="text-right text-xs leading-none text-slate-500">$0</span>
              </div>
              {/* Plot area */}
              <div className="flex flex-1 flex-col overflow-x-auto">
                <div className="relative flex h-40 items-end gap-4">
                  <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-slate-700/50" />
                  <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-slate-700/50" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 border-t border-slate-700/50" />
                  {projectSpendData.map((p) => (
                    <div key={p.name} className="flex flex-shrink-0 items-end gap-1">
                      <div
                        className="w-5 rounded-md bg-slate-700"
                        style={{ height: `${Math.max(Math.round((p.budget / maxVal) * 160), 2)}px` }}
                        title={`Budget: ${fmt.format(p.budget)}`}
                      />
                      <div
                        className="w-5 rounded-md bg-sky-400"
                        style={{ height: `${Math.max(Math.round((p.actual / maxVal) * 160), 2)}px` }}
                        title={`Actual: ${fmt.format(p.actual)}`}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-1 flex gap-4">
                  {projectSpendData.map((p) => (
                    <div key={p.name} className="w-11 flex-shrink-0 truncate text-center text-xs text-slate-400" title={p.name}>{p.name}</div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="rounded-2xl bg-panel p-6 shadow-lg">
          <div className="text-sm font-semibold text-slate-200">Tasks Due Soon</div>
          <div className="mt-4 space-y-3">
            {tasksDueSoon.length === 0 ? (
              <div className="text-sm text-slate-500">No tasks due in the next 7 days.</div>
            ) : (
              tasksDueSoon.map((t) => (
                <div key={t.id} className="rounded-lg bg-surface px-3 py-2 text-sm">
                  <div className="font-medium text-slate-100">{t.title}</div>
                  <div className="text-xs text-slate-400">{t.projectName} &middot; Due {t.dueDate}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
      <section className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-panel p-6 shadow-lg">
          <div className="text-sm font-semibold text-slate-200">Recent Expenses</div>
          <div className="mt-4 divide-y divide-slate-800 text-sm">
            {recentExpenses.length === 0 ? (
              <div className="py-3 text-sm text-slate-500">No expenses recorded yet.</div>
            ) : (
              recentExpenses.map((e) => (
                <div key={e.id} className="grid grid-cols-1 gap-2 py-3 text-slate-300 sm:grid-cols-[2fr_2fr_1fr_1fr] sm:gap-0">
                  <div className="font-medium text-slate-100">{e.vendorName}</div>
                  <div className="text-slate-400">{e.projectName}</div>
                  <div className="text-slate-400">{e.expenseDate}</div>
                  <div className="text-amber-400">-{fmt.format(e.amount)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default DashboardView;
