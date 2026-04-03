import { useEffect, useState } from 'react';
import { getApiBase } from '../lib/api';
import type { Category, ExpenseItem, ProjectItem, VendorItem } from '../types/projects';

const API_BASE = getApiBase();
const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtFull = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

type Props = { token: string };

const ReportsView = ({ token }: Props) => {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    const load = async () => {
      setLoading(true);
      try {
        const [pRes, eRes, cRes, vRes] = await Promise.all([
          fetch(`${API_BASE}/projects`, { headers }),
          fetch(`${API_BASE}/expenses`, { headers }),
          fetch(`${API_BASE}/categories`, { headers }),
          fetch(`${API_BASE}/vendors`, { headers }),
        ]);
        const [pData, eData, cData, vData] = await Promise.all([
          pRes.json() as Promise<{ data: ProjectItem[] }>,
          eRes.json() as Promise<{ data: ExpenseItem[] }>,
          cRes.json() as Promise<{ data: Category[] }>,
          vRes.json() as Promise<{ data: VendorItem[] }>,
        ]);
        setProjects(pData.data);
        setExpenses(eData.data);
        setCategories(cData.data);
        setVendors(vData.data);
      } catch {
        setError('Unable to load report data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  if (loading) return <div className="px-4 py-6 text-sm text-slate-400 sm:px-6 lg:px-8">Loading reports...</div>;
  if (error) return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>
    </div>
  );

  // — Budget vs actual —
  const spendByProject: Record<string, number> = {};
  for (const e of expenses) {
    spendByProject[e.projectId] = (spendByProject[e.projectId] ?? 0) + e.amount;
  }
  const budgetRows = projects
    .filter((p) => (p.budgetTotal ?? 0) > 0 || spendByProject[p.id])
    .map((p) => {
      const actual = spendByProject[p.id] ?? 0;
      const budget = p.budgetTotal ?? 0;
      const variance = budget - actual;
      return { ...p, actual, variance };
    })
    .sort((a, b) => b.actual - a.actual);

  // — Spend by category —
  const spendByCategory: Record<string, number> = {};
  for (const e of expenses) {
    spendByCategory[e.categoryId] = (spendByCategory[e.categoryId] ?? 0) + e.amount;
  }
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const categoryRows = Object.entries(spendByCategory)
    .map(([id, amount]) => ({ id, name: categories.find((c) => c.id === id)?.name ?? id, amount }))
    .sort((a, b) => b.amount - a.amount);

  // — Top vendors by spend —
  const spendByVendor: Record<string, number> = {};
  for (const e of expenses) {
    spendByVendor[e.vendorId] = (spendByVendor[e.vendorId] ?? 0) + e.amount;
  }
  const vendorRows = Object.entries(spendByVendor)
    .map(([id, amount]) => ({ id, name: vendors.find((v) => v.id === id)?.name ?? id, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  // — Project status summary —
  const statusCounts: Record<string, number> = {};
  for (const p of projects) {
    statusCounts[p.status] = (statusCounts[p.status] ?? 0) + 1;
  }
  const statusLabel: Record<string, string> = { planning: 'Planning', active: 'Active', on_hold: 'On Hold', completed: 'Completed' };
  const statusColor: Record<string, string> = {
    planning: 'bg-slate-700 text-slate-300',
    active: 'bg-sky-900 text-sky-300',
    on_hold: 'bg-amber-900/50 text-amber-300',
    completed: 'bg-emerald-900/50 text-emerald-300',
  };

  return (
    <>
      <header className="flex flex-col gap-4 bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div>
          <div className="text-2xl font-semibold font-display">Reports</div>
          <div className="text-sm text-slate-400">Financial and project summaries.</div>
        </div>
      </header>

      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">

        {/* KPI row */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: 'Total Projects', value: projects.length.toString(), accent: 'text-violet-300' },
            { label: 'Total Budget', value: fmt.format(projects.reduce((s, p) => s + (p.budgetTotal ?? 0), 0)), accent: 'text-emerald-300' },
            { label: 'Total Spend', value: fmt.format(totalExpenses), accent: 'text-amber-300' },
            { label: 'Total Variance', value: fmt.format(projects.reduce((s, p) => s + (p.budgetTotal ?? 0), 0) - totalExpenses), accent: 'text-sky-300' },
          ].map(({ label, value, accent }) => (
            <div key={label} className="rounded-2xl bg-panel p-5 shadow-lg">
              <div className="text-xs text-slate-400">{label}</div>
              <div className={`mt-2 text-xl font-semibold ${accent}`}>{value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* Budget vs Actual */}
          <div className="rounded-2xl bg-panel p-6 shadow-lg">
            <div className="text-sm font-semibold text-slate-200">Budget vs Actual by Project</div>
            <div className="mt-4 text-sm">
              {budgetRows.length === 0 ? (
                <div className="text-slate-400">No project budget data yet.</div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {budgetRows.map((p) => {
                    const pct = p.budgetTotal ? Math.min((p.actual / p.budgetTotal) * 100, 100) : 0;
                    const over = p.variance < 0;
                    return (
                      <div key={p.id} className="py-3">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-slate-100 truncate pr-4">{p.name}</div>
                          <div className={`shrink-0 text-xs font-semibold ${over ? 'text-red-400' : 'text-emerald-400'}`}>
                            {over ? '-' : '+'}{fmt.format(Math.abs(p.variance))}
                          </div>
                        </div>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                          <div className={`h-full rounded-full ${over ? 'bg-red-500' : 'bg-accent'}`} style={{ width: `${pct}%` }} />
                        </div>
                        <div className="mt-1 flex justify-between text-xs text-slate-500">
                          <span>{fmt.format(p.actual)} spent</span>
                          <span>{fmt.format(p.budgetTotal ?? 0)} budget</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Spend by Category */}
          <div className="rounded-2xl bg-panel p-6 shadow-lg">
            <div className="text-sm font-semibold text-slate-200">Spend by Category</div>
            <div className="mt-4 text-sm">
              {categoryRows.length === 0 ? (
                <div className="text-slate-400">No expense data yet.</div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {categoryRows.map(({ id, name, amount }) => {
                    const pct = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
                    return (
                      <div key={id} className="py-3">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-slate-100">{name}</div>
                          <div className="text-xs text-slate-300">{fmtFull.format(amount)} <span className="text-slate-500">({pct.toFixed(1)}%)</span></div>
                        </div>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                          <div className="h-full rounded-full bg-violet-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Top Vendors */}
          <div className="rounded-2xl bg-panel p-6 shadow-lg">
            <div className="text-sm font-semibold text-slate-200">Top Vendors by Spend</div>
            <div className="mt-4 text-sm">
              {vendorRows.length === 0 ? (
                <div className="text-slate-400">No vendor spend data yet.</div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {vendorRows.map(({ id, name, amount }, i) => (
                    <div key={id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-5 text-right text-xs text-slate-500">{i + 1}.</div>
                        <div className="font-medium text-slate-100">{name}</div>
                      </div>
                      <div className="text-sm font-semibold text-slate-100">{fmtFull.format(amount)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Projects by Status */}
          <div className="rounded-2xl bg-panel p-6 shadow-lg">
            <div className="text-sm font-semibold text-slate-200">Projects by Status</div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between rounded-xl bg-surface px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[status] ?? 'bg-slate-700 text-slate-300'}`}>
                    {statusLabel[status] ?? status}
                  </span>
                  <span className="text-lg font-semibold text-slate-100">{count}</span>
                </div>
              ))}
              {Object.keys(statusCounts).length === 0 && (
                <div className="col-span-2 text-slate-400">No projects yet.</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default ReportsView;
