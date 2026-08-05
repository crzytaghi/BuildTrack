import { describe, it, expect } from 'vitest';
import {
  computeKpis,
  computeSpendByMonth,
  computeSpendByCategory,
} from '../dashboardUtils';
import type { ProjectItem, ExpenseItem, Category } from '../../types/projects';

const makeProject = (overrides: Partial<ProjectItem> = {}): ProjectItem => ({
  id: 'p1',
  name: 'Project 1',
  status: 'active',
  budgetTotal: 0,
  ...overrides,
});

const makeExpense = (overrides: Partial<ExpenseItem> = {}): ExpenseItem => ({
  id: 'e1',
  projectId: 'p1',
  amount: 100,
  categoryId: 'cat1',
  vendorId: 'v1',
  description: 'Test expense',
  expenseDate: '2026-08-01',
  ...overrides,
});

// ——— computeKpis ———

describe('computeKpis', () => {
  it('sums budgetTotal from all projects', () => {
    const projects = [
      makeProject({ id: 'p1', budgetTotal: 1000 }),
      makeProject({ id: 'p2', budgetTotal: 2000 }),
    ];
    const kpis = computeKpis(projects, []);
    expect(kpis[0].label).toBe('Total Budget');
    expect(kpis[0].value).toContain('3');
  });

  it('sums amount from all expenses', () => {
    const expenses = [
      makeExpense({ id: 'e1', amount: 400 }),
      makeExpense({ id: 'e2', amount: 600 }),
    ];
    const kpis = computeKpis([], expenses);
    expect(kpis[1].label).toBe('Actual Spend');
    expect(kpis[1].value).toContain('1');
  });

  it('variance is positive when budget exceeds spend', () => {
    const projects = [makeProject({ budgetTotal: 5000 })];
    const expenses = [makeExpense({ amount: 3000 })];
    const kpis = computeKpis(projects, expenses);
    expect(kpis[2].label).toBe('Variance');
    expect(kpis[2].tone).toBe('bg-sky-400');
  });

  it('variance tone is red when spend exceeds budget', () => {
    const projects = [makeProject({ budgetTotal: 1000 })];
    const expenses = [makeExpense({ amount: 2000 })];
    const kpis = computeKpis(projects, expenses);
    expect(kpis[2].tone).toBe('bg-red-400');
  });

  it('counts only active projects', () => {
    const projects = [
      makeProject({ id: 'p1', status: 'active' }),
      makeProject({ id: 'p2', status: 'active' }),
      makeProject({ id: 'p3', status: 'completed' }),
      makeProject({ id: 'p4', status: 'planning' }),
    ];
    const kpis = computeKpis(projects, []);
    expect(kpis[3].label).toBe('Active Projects');
    expect(kpis[3].value).toBe('2');
  });
});

// ——— computeSpendByMonth ———

describe('computeSpendByMonth', () => {
  it('returns exactly 6 items', () => {
    const result = computeSpendByMonth([]);
    expect(result).toHaveLength(6);
  });

  it('months are consecutive ending with current month', () => {
    const result = computeSpendByMonth([]);
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    expect(result[5].month).toBe(currentMonth);
    // each month differs from previous by 1 month
    for (let i = 1; i < 6; i++) {
      const prev = new Date(result[i - 1].month + '-01');
      const curr = new Date(result[i].month + '-01');
      const monthDiff =
        (curr.getFullYear() - prev.getFullYear()) * 12 + (curr.getMonth() - prev.getMonth());
      expect(monthDiff).toBe(1);
    }
  });

  it('sums expense amounts for matching months', () => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const expenses = [
      makeExpense({ id: 'e1', amount: 200, expenseDate: `${currentMonth}-05` }),
      makeExpense({ id: 'e2', amount: 300, expenseDate: `${currentMonth}-15` }),
    ];
    const result = computeSpendByMonth(expenses);
    expect(result[5].amount).toBe(500);
  });

  it('returns 0 for months with no expenses', () => {
    const result = computeSpendByMonth([]);
    result.forEach((m) => expect(m.amount).toBe(0));
  });
});

// ——— computeSpendByCategory ———

describe('computeSpendByCategory', () => {
  const categories: Category[] = [
    { id: 'cat1', name: 'Materials' },
    { id: 'cat2', name: 'Labor' },
    { id: 'cat3', name: 'Equipment' },
  ];

  it('maps each category to its total expense spend', () => {
    const expenses = [
      makeExpense({ id: 'e1', categoryId: 'cat1', amount: 500 }),
      makeExpense({ id: 'e2', categoryId: 'cat1', amount: 300 }),
      makeExpense({ id: 'e3', categoryId: 'cat2', amount: 200 }),
    ];
    const result = computeSpendByCategory(categories, expenses);
    const materials = result.find((c) => c.name === 'Materials');
    expect(materials?.amount).toBe(800);
    const labor = result.find((c) => c.name === 'Labor');
    expect(labor?.amount).toBe(200);
  });

  it('filters out categories with zero spend', () => {
    const expenses = [makeExpense({ categoryId: 'cat1', amount: 100 })];
    const result = computeSpendByCategory(categories, expenses);
    expect(result.find((c) => c.name === 'Equipment')).toBeUndefined();
  });

  it('sorts descending by amount', () => {
    const expenses = [
      makeExpense({ id: 'e1', categoryId: 'cat2', amount: 1000 }),
      makeExpense({ id: 'e2', categoryId: 'cat1', amount: 500 }),
    ];
    const result = computeSpendByCategory(categories, expenses);
    expect(result[0].name).toBe('Labor');
    expect(result[1].name).toBe('Materials');
  });
});
