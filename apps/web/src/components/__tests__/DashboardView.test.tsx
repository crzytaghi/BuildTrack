import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DashboardView from '../DashboardView';
import type { MonthSpend, CategorySpend, Kpi, TaskDueSoon, RecentExpense, ProjectSpend } from '../../lib/dashboardUtils';

const kpis: Kpi[] = [
  { label: 'Total Budget', value: '$10K', tone: 'bg-emerald-400' },
  { label: 'Actual Spend', value: '$5K', tone: 'bg-amber-400' },
  { label: 'Variance', value: '$5K', tone: 'bg-sky-400' },
  { label: 'Active Projects', value: '3', tone: 'bg-violet-400' },
];

const baseProps = {
  userName: 'Alice',
  companyName: 'Acme Builders',
  kpis,
  tasksDueSoon: [] as TaskDueSoon[],
  recentExpenses: [] as RecentExpense[],
  projectSpendData: [] as ProjectSpend[],
  spendByMonth: [] as MonthSpend[],
  spendByCategory: [] as CategorySpend[],
};

describe('DashboardView', () => {
  it('renders company name and user name in header', () => {
    render(<DashboardView {...baseProps} />);
    expect(screen.getByText('Acme Builders')).toBeInTheDocument();
    expect(screen.getByText('Welcome back, Alice.')).toBeInTheDocument();
  });

  it('renders all 4 KPI card labels', () => {
    render(<DashboardView {...baseProps} />);
    expect(screen.getByText('Total Budget')).toBeInTheDocument();
    expect(screen.getByText('Actual Spend')).toBeInTheDocument();
    expect(screen.getByText('Variance')).toBeInTheDocument();
    expect(screen.getByText('Active Projects')).toBeInTheDocument();
  });

  it('shows empty state when tasksDueSoon is empty', () => {
    render(<DashboardView {...baseProps} tasksDueSoon={[]} />);
    expect(screen.getByText('No tasks due in the next 7 days.')).toBeInTheDocument();
  });

  it('renders task titles when tasksDueSoon has items', () => {
    const tasks: TaskDueSoon[] = [
      { id: 't1', title: 'Frame the walls', dueDate: '2026-08-07', projectName: 'Project A' },
      { id: 't2', title: 'Install windows', dueDate: '2026-08-08', projectName: 'Project B' },
    ];
    render(<DashboardView {...baseProps} tasksDueSoon={tasks} />);
    expect(screen.getByText('Frame the walls')).toBeInTheDocument();
    expect(screen.getByText('Install windows')).toBeInTheDocument();
  });

  it('shows empty state when recentExpenses is empty', () => {
    render(<DashboardView {...baseProps} recentExpenses={[]} />);
    expect(screen.getByText('No expenses recorded yet.')).toBeInTheDocument();
  });

  it('renders vendor names when recentExpenses has items', () => {
    const expenses: RecentExpense[] = [
      { id: 'e1', vendorName: 'Lumber Co', projectName: 'Project A', amount: 500, expenseDate: '2026-08-01' },
      { id: 'e2', vendorName: 'Steel Inc', projectName: 'Project B', amount: 200, expenseDate: '2026-08-02' },
    ];
    render(<DashboardView {...baseProps} recentExpenses={expenses} />);
    expect(screen.getByText('Lumber Co')).toBeInTheDocument();
    expect(screen.getByText('Steel Inc')).toBeInTheDocument();
  });

  it('renders exactly 6 bars in Monthly Spend', () => {
    const spendByMonth: MonthSpend[] = [
      { month: '2026-03', amount: 100 },
      { month: '2026-04', amount: 200 },
      { month: '2026-05', amount: 0 },
      { month: '2026-06', amount: 400 },
      { month: '2026-07', amount: 500 },
      { month: '2026-08', amount: 600 },
    ];
    render(<DashboardView {...baseProps} spendByMonth={spendByMonth} />);
    // Each bar is a div with a rounded-t-md class in the monthly spend chart
    const bars = document.querySelectorAll('.rounded-t-md');
    expect(bars).toHaveLength(6);
  });

  it('shows empty state in Spend by Category when spendByCategory is empty', () => {
    render(<DashboardView {...baseProps} spendByCategory={[]} />);
    expect(screen.getByText('No expense data yet.')).toBeInTheDocument();
  });
});
