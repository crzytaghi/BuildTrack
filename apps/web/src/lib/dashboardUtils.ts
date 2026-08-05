import type { ProjectItem, TaskItem, ExpenseItem, VendorItem, Category } from '../types/projects';

const fmtCompact = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export type Kpi = { label: string; value: string; tone: string };
export type TaskDueSoon = { id: string; title: string; dueDate?: string; projectName: string };
export type RecentExpense = {
  id: string;
  vendorName: string;
  projectName: string;
  amount: number;
  expenseDate: string;
};
export type ProjectSpend = { name: string; budget: number; actual: number };
export type MonthSpend = { month: string; amount: number };
export type CategorySpend = { name: string; amount: number };

export function computeKpis(projects: ProjectItem[], expenses: ExpenseItem[]): Kpi[] {
  const totalBudget = projects.reduce((sum, p) => sum + (p.budgetTotal ?? 0), 0);
  const totalSpend = expenses.reduce((sum, e) => sum + e.amount, 0);
  const variance = totalBudget - totalSpend;
  const activeProjects = projects.filter((p) => p.status === 'active').length;
  return [
    { label: 'Total Budget', value: fmtCompact.format(totalBudget), tone: 'bg-emerald-400' },
    { label: 'Actual Spend', value: fmtCompact.format(totalSpend), tone: 'bg-amber-400' },
    { label: 'Variance', value: fmtCompact.format(variance), tone: variance >= 0 ? 'bg-sky-400' : 'bg-red-400' },
    { label: 'Active Projects', value: String(activeProjects), tone: 'bg-violet-400' },
  ];
}

export function computeTasksDueSoon(
  tasks: TaskItem[],
  projects: ProjectItem[],
  today: string,
  sevenDaysOut: string,
): TaskDueSoon[] {
  return tasks
    .filter((t) => t.status !== 'done' && t.dueDate && t.dueDate >= today && t.dueDate <= sevenDaysOut)
    .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
    .slice(0, 5)
    .map((t) => ({
      ...t,
      projectName: projects.find((p) => p.id === t.projectId)?.name ?? 'Unknown Project',
    }));
}

export function computeRecentExpenses(
  expenses: ExpenseItem[],
  vendors: VendorItem[],
  projects: ProjectItem[],
): RecentExpense[] {
  return [...expenses]
    .sort((a, b) => b.expenseDate.localeCompare(a.expenseDate))
    .slice(0, 5)
    .map((e) => ({
      ...e,
      vendorName: vendors.find((v) => v.id === e.vendorId)?.name ?? 'Unknown Vendor',
      projectName: projects.find((p) => p.id === e.projectId)?.name ?? 'Unknown Project',
    }));
}

export function computeProjectSpendData(projects: ProjectItem[], expenses: ExpenseItem[]): ProjectSpend[] {
  const spendByProject = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.projectId] = (acc[e.projectId] ?? 0) + e.amount;
    return acc;
  }, {});
  return projects
    .filter((p) => (p.budgetTotal ?? 0) > 0 || spendByProject[p.id])
    .map((p) => ({ name: p.name, budget: p.budgetTotal ?? 0, actual: spendByProject[p.id] ?? 0 }));
}

export function computeSpendByMonth(expenses: ExpenseItem[]): MonthSpend[] {
  const now = new Date();
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  return last6Months.map((month) => ({
    month,
    amount: expenses
      .filter((e) => e.expenseDate.startsWith(month))
      .reduce((sum, e) => sum + e.amount, 0),
  }));
}

export function computeSpendByCategory(categories: Category[], expenses: ExpenseItem[]): CategorySpend[] {
  return categories
    .map((cat) => ({
      name: cat.name,
      amount: expenses
        .filter((e) => e.categoryId === cat.id)
        .reduce((sum, e) => sum + e.amount, 0),
    }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);
}
