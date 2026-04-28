import {
  computeKpis,
  computeTasksDueSoon,
  computeRecentExpenses,
} from '../src/hooks/useDashboard';
import type { ExpenseItem, ProjectItem, TaskItem, VendorItem } from '../src/types';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeProject = (overrides: Partial<ProjectItem> = {}): ProjectItem => ({
  id: 'proj_1',
  name: 'Test Project',
  status: 'active',
  budgetTotal: 100_000,
  ...overrides,
});

const makeTask = (overrides: Partial<TaskItem> = {}): TaskItem => ({
  id: 'task_1',
  projectId: 'proj_1',
  title: 'Test Task',
  status: 'todo',
  dueDate: '2026-04-30',
  ...overrides,
});

const makeExpense = (overrides: Partial<ExpenseItem> = {}): ExpenseItem => ({
  id: 'exp_1',
  projectId: 'proj_1',
  vendorId: 'vendor_1',
  amount: 5000,
  categoryId: 'cat_1',
  description: 'Materials',
  expenseDate: '2026-04-20',
  ...overrides,
});

const makeVendor = (overrides: Partial<VendorItem> = {}): VendorItem => ({
  id: 'vendor_1',
  name: 'ABC Supplies',
  ...overrides,
});

// ─── computeKpis ──────────────────────────────────────────────────────────────

describe('computeKpis', () => {
  it('calculates total budget from all projects', () => {
    const projects = [makeProject({ budgetTotal: 100_000 }), makeProject({ id: 'proj_2', budgetTotal: 50_000 })];
    const kpis = computeKpis(projects, []);
    expect(kpis.find((k) => k.label === 'Total Budget')?.value).toBe('$150.0k');
  });

  it('treats missing budgetTotal as 0', () => {
    const projects = [makeProject({ budgetTotal: undefined })];
    const kpis = computeKpis(projects, []);
    expect(kpis.find((k) => k.label === 'Total Budget')?.value).toBe('$0');
  });

  it('calculates actual spend from all expenses', () => {
    const expenses = [makeExpense({ amount: 3000 }), makeExpense({ id: 'exp_2', amount: 2000 })];
    const kpis = computeKpis([], expenses);
    expect(kpis.find((k) => k.label === 'Actual Spend')?.value).toBe('$5.0k');
  });

  it('variance is positive when under budget', () => {
    const projects = [makeProject({ budgetTotal: 100_000 })];
    const expenses = [makeExpense({ amount: 40_000 })];
    const kpis = computeKpis(projects, expenses);
    const variance = kpis.find((k) => k.label === 'Variance')!;
    expect(variance.positive).toBe(true);
    expect(variance.value).toBe('$60.0k');
  });

  it('variance is negative when over budget', () => {
    const projects = [makeProject({ budgetTotal: 10_000 })];
    const expenses = [makeExpense({ amount: 15_000 })];
    const kpis = computeKpis(projects, expenses);
    const variance = kpis.find((k) => k.label === 'Variance')!;
    expect(variance.positive).toBe(false);
  });

  it('counts only active projects', () => {
    const projects = [
      makeProject({ id: 'p1', status: 'active' }),
      makeProject({ id: 'p2', status: 'active' }),
      makeProject({ id: 'p3', status: 'completed' }),
      makeProject({ id: 'p4', status: 'planning' }),
    ];
    const kpis = computeKpis(projects, []);
    expect(kpis.find((k) => k.label === 'Active Projects')?.value).toBe('2');
  });

  it('returns null positive flag for non-variance KPIs', () => {
    const kpis = computeKpis([], []);
    expect(kpis.find((k) => k.label === 'Total Budget')?.positive).toBeNull();
    expect(kpis.find((k) => k.label === 'Active Projects')?.positive).toBeNull();
  });

  it('formats millions correctly', () => {
    const projects = [makeProject({ budgetTotal: 1_420_000 })];
    const kpis = computeKpis(projects, []);
    expect(kpis.find((k) => k.label === 'Total Budget')?.value).toBe('$1.42M');
  });
});

// ─── computeTasksDueSoon ──────────────────────────────────────────────────────

describe('computeTasksDueSoon', () => {
  const today = '2026-04-28';
  const sevenDaysOut = '2026-05-05';

  it('includes tasks due within the next 7 days', () => {
    const tasks = [makeTask({ dueDate: '2026-04-30' })];
    const result = computeTasksDueSoon(tasks, [makeProject()], today, sevenDaysOut);
    expect(result).toHaveLength(1);
  });

  it('excludes tasks with status done', () => {
    const tasks = [makeTask({ status: 'done', dueDate: '2026-04-30' })];
    const result = computeTasksDueSoon(tasks, [], today, sevenDaysOut);
    expect(result).toHaveLength(0);
  });

  it('excludes tasks with no due date', () => {
    const tasks = [makeTask({ dueDate: undefined })];
    const result = computeTasksDueSoon(tasks, [], today, sevenDaysOut);
    expect(result).toHaveLength(0);
  });

  it('excludes tasks due before today', () => {
    const tasks = [makeTask({ dueDate: '2026-04-27' })];
    const result = computeTasksDueSoon(tasks, [], today, sevenDaysOut);
    expect(result).toHaveLength(0);
  });

  it('excludes tasks due after 7 days', () => {
    const tasks = [makeTask({ dueDate: '2026-05-10' })];
    const result = computeTasksDueSoon(tasks, [], today, sevenDaysOut);
    expect(result).toHaveLength(0);
  });

  it('caps results at 5', () => {
    const tasks = Array.from({ length: 8 }, (_, i) =>
      makeTask({ id: `task_${i}`, dueDate: '2026-04-30' })
    );
    const result = computeTasksDueSoon(tasks, [], today, sevenDaysOut);
    expect(result).toHaveLength(5);
  });

  it('sorts by due date ascending', () => {
    const tasks = [
      makeTask({ id: 't1', dueDate: '2026-05-03' }),
      makeTask({ id: 't2', dueDate: '2026-04-29' }),
      makeTask({ id: 't3', dueDate: '2026-05-01' }),
    ];
    const result = computeTasksDueSoon(tasks, [], today, sevenDaysOut);
    expect(result.map((t) => t.dueDate)).toEqual(['2026-04-29', '2026-05-01', '2026-05-03']);
  });

  it('resolves project name', () => {
    const tasks = [makeTask({ projectId: 'proj_1', dueDate: '2026-04-30' })];
    const projects = [makeProject({ id: 'proj_1', name: 'Main Site' })];
    const result = computeTasksDueSoon(tasks, projects, today, sevenDaysOut);
    expect(result[0].projectName).toBe('Main Site');
  });

  it('falls back to Unknown Project when project not found', () => {
    const tasks = [makeTask({ projectId: 'proj_999', dueDate: '2026-04-30' })];
    const result = computeTasksDueSoon(tasks, [], today, sevenDaysOut);
    expect(result[0].projectName).toBe('Unknown Project');
  });
});

// ─── computeRecentExpenses ────────────────────────────────────────────────────

describe('computeRecentExpenses', () => {
  it('sorts by expense date descending', () => {
    const expenses = [
      makeExpense({ id: 'e1', expenseDate: '2026-04-10' }),
      makeExpense({ id: 'e2', expenseDate: '2026-04-20' }),
      makeExpense({ id: 'e3', expenseDate: '2026-04-15' }),
    ];
    const result = computeRecentExpenses(expenses, [], []);
    expect(result.map((e) => e.expenseDate)).toEqual(['2026-04-20', '2026-04-15', '2026-04-10']);
  });

  it('caps results at 5', () => {
    const expenses = Array.from({ length: 8 }, (_, i) =>
      makeExpense({ id: `exp_${i}`, expenseDate: `2026-04-${String(i + 1).padStart(2, '0')}` })
    );
    const result = computeRecentExpenses(expenses, [], []);
    expect(result).toHaveLength(5);
  });

  it('resolves vendor name', () => {
    const expenses = [makeExpense({ vendorId: 'vendor_1' })];
    const vendors = [makeVendor({ id: 'vendor_1', name: 'ABC Supplies' })];
    const result = computeRecentExpenses(expenses, [], vendors);
    expect(result[0].vendorName).toBe('ABC Supplies');
  });

  it('resolves project name', () => {
    const expenses = [makeExpense({ projectId: 'proj_1' })];
    const projects = [makeProject({ id: 'proj_1', name: 'Downtown Build' })];
    const result = computeRecentExpenses(expenses, projects, []);
    expect(result[0].projectName).toBe('Downtown Build');
  });

  it('falls back to Unknown Vendor when vendor not found', () => {
    const result = computeRecentExpenses([makeExpense({ vendorId: 'no_such_vendor' })], [], []);
    expect(result[0].vendorName).toBe('Unknown Vendor');
  });

  it('returns empty array for no expenses', () => {
    const result = computeRecentExpenses([], [], []);
    expect(result).toHaveLength(0);
  });
});
