import { useCallback, useEffect, useState } from 'react';
import { getApiBase } from '../lib/api';
import type { ExpenseItem, ProjectItem, TaskItem, VendorItem } from '../types';

const API_BASE = getApiBase();

// ─── KPI types ────────────────────────────────────────────────────────────────

export type DashboardKpi = {
  label: string;
  value: string;
  positive: boolean | null; // null = neutral (active projects count)
};

export type TaskDueSoon = TaskItem & { projectName: string };

export type RecentExpense = ExpenseItem & {
  vendorName: string;
  projectName: string;
};

export type DashboardData = {
  kpis: DashboardKpi[];
  tasksDueSoon: TaskDueSoon[];
  recentExpenses: RecentExpense[];
};

export type UseDashboardResult = {
  data: DashboardData | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => void;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtCompact = (n: number): string => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n.toLocaleString()}`;
};

const todayStr = (): string => new Date().toISOString().slice(0, 10);

const sevenDaysOutStr = (): string =>
  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

// ─── Pure computation (exported for unit testing) ─────────────────────────────

export const computeKpis = (
  projects: ProjectItem[],
  expenses: ExpenseItem[],
): DashboardKpi[] => {
  const totalBudget = projects.reduce((s, p) => s + (p.budgetTotal ?? 0), 0);
  const totalSpend = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const variance = totalBudget - totalSpend;
  const activeProjects = projects.filter((p) => p.status === 'active').length;

  return [
    { label: 'Total Budget', value: fmtCompact(totalBudget), positive: null },
    { label: 'Actual Spend', value: fmtCompact(totalSpend), positive: null },
    { label: 'Variance', value: fmtCompact(variance), positive: variance >= 0 },
    { label: 'Active Projects', value: String(activeProjects), positive: null },
  ];
};

export const computeTasksDueSoon = (
  tasks: TaskItem[],
  projects: ProjectItem[],
  today = todayStr(),
  sevenDaysOut = sevenDaysOutStr(),
): TaskDueSoon[] => {
  const projectMap: Record<string, string> = {};
  projects.forEach((p) => { projectMap[p.id] = p.name; });

  return tasks
    .filter(
      (t) =>
        t.status !== 'done' &&
        t.dueDate != null &&
        t.dueDate >= today &&
        t.dueDate <= sevenDaysOut,
    )
    .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
    .slice(0, 5)
    .map((t) => ({ ...t, projectName: projectMap[t.projectId] ?? 'Unknown Project' }));
};

export const computeRecentExpenses = (
  expenses: ExpenseItem[],
  projects: ProjectItem[],
  vendors: VendorItem[],
): RecentExpense[] => {
  const projectMap: Record<string, string> = {};
  projects.forEach((p) => { projectMap[p.id] = p.name; });

  const vendorMap: Record<string, string> = {};
  vendors.forEach((v) => { vendorMap[v.id] = v.name; });

  return [...expenses]
    .sort((a, b) => b.expenseDate.localeCompare(a.expenseDate))
    .slice(0, 5)
    .map((e) => ({
      ...e,
      vendorName: vendorMap[e.vendorId] ?? 'Unknown Vendor',
      projectName: projectMap[e.projectId] ?? 'Unknown Project',
    }));
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useDashboard = (token: string): UseDashboardResult => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [projectsRes, tasksRes, expensesRes, vendorsRes] = await Promise.all([
          fetch(`${API_BASE}/projects`, { headers }),
          fetch(`${API_BASE}/tasks`, { headers }),
          fetch(`${API_BASE}/expenses`, { headers }),
          fetch(`${API_BASE}/vendors`, { headers }),
        ]);

        if (!projectsRes.ok || !tasksRes.ok || !expensesRes.ok || !vendorsRes.ok) {
          throw new Error('Unable to load dashboard data');
        }

        const [projectsData, tasksData, expensesData, vendorsData] = await Promise.all([
          projectsRes.json() as Promise<{ data: ProjectItem[] }>,
          tasksRes.json() as Promise<{ data: TaskItem[] }>,
          expensesRes.json() as Promise<{ data: ExpenseItem[] }>,
          vendorsRes.json() as Promise<{ data: VendorItem[] }>,
        ]);

        const projects = projectsData.data;
        const tasks = tasksData.data;
        const expenses = expensesData.data;
        const vendors = vendorsData.data;

        setData({
          kpis: computeKpis(projects, expenses),
          tasksDueSoon: computeTasksDueSoon(tasks, projects),
          recentExpenses: computeRecentExpenses(expenses, projects, vendors),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load dashboard data');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token],
  );

  useEffect(() => {
    fetchAll(false);
  }, [fetchAll]);

  const refresh = useCallback(() => {
    if (!refreshing) fetchAll(true);
  }, [fetchAll, refreshing]);

  return { data, loading, refreshing, error, refresh };
};
