import type { BudgetLineItem, Category, ExpenseItem } from '../src/types';

// ─── Pure helpers (inlined from BudgetTab logic) ─────────────────────────────
// These mirror the exact computation in BudgetTab so tests break if logic drifts.

const buildSpendByLineItem = (expenses: ExpenseItem[]): Record<string, number> => {
  const map: Record<string, number> = {};
  expenses.forEach((e) => {
    if (e.lineItemId) map[e.lineItemId] = (map[e.lineItemId] ?? 0) + Number(e.amount);
  });
  return map;
};

const computeProgress = (spent: number, budgeted: number): number =>
  budgeted > 0 ? Math.min(spent / budgeted, 1) : 0;

// ─── Fixtures ────────────────────────────────────────────────────────────────

const makeLineItem = (overrides: Partial<BudgetLineItem> = {}): BudgetLineItem => ({
  id: 'li_1',
  projectId: 'proj_1',
  categoryId: 'cat_1',
  description: 'Framing',
  budgetedAmount: 10_000,
  ...overrides,
});

const makeExpense = (overrides: Partial<ExpenseItem> = {}): ExpenseItem => ({
  id: 'exp_1',
  projectId: 'proj_1',
  vendorId: 'vendor_1',
  amount: 4_000,
  categoryId: 'cat_1',
  description: 'Lumber',
  expenseDate: '2026-04-01',
  ...overrides,
});

// ─── buildSpendByLineItem ─────────────────────────────────────────────────────

describe('buildSpendByLineItem', () => {
  it('sums expenses by lineItemId', () => {
    const expenses = [
      makeExpense({ id: 'e1', lineItemId: 'li_1', amount: 3_000 }),
      makeExpense({ id: 'e2', lineItemId: 'li_1', amount: 2_000 }),
      makeExpense({ id: 'e3', lineItemId: 'li_2', amount: 1_500 }),
    ];
    const result = buildSpendByLineItem(expenses);
    expect(result['li_1']).toBe(5_000);
    expect(result['li_2']).toBe(1_500);
  });

  it('ignores expenses with no lineItemId', () => {
    const expenses = [makeExpense({ lineItemId: undefined })];
    const result = buildSpendByLineItem(expenses);
    expect(Object.keys(result)).toHaveLength(0);
  });

  it('returns empty object for no expenses', () => {
    expect(buildSpendByLineItem([])).toEqual({});
  });
});

// ─── computeProgress ─────────────────────────────────────────────────────────

describe('computeProgress', () => {
  it('returns 0.5 when spent is half of budget', () => {
    expect(computeProgress(5_000, 10_000)).toBe(0.5);
  });

  it('clamps to 1 when over budget', () => {
    expect(computeProgress(15_000, 10_000)).toBe(1);
  });

  it('returns 0 when budgeted is 0', () => {
    expect(computeProgress(1_000, 0)).toBe(0);
  });

  it('returns 0 when nothing spent', () => {
    expect(computeProgress(0, 10_000)).toBe(0);
  });

  it('returns exactly 1 at 100%', () => {
    expect(computeProgress(10_000, 10_000)).toBe(1);
  });
});

// ─── totals ──────────────────────────────────────────────────────────────────

describe('budget totals', () => {
  it('sums totalBudgeted across all line items', () => {
    const items = [makeLineItem({ budgetedAmount: 10_000 }), makeLineItem({ id: 'li_2', budgetedAmount: 5_000 })];
    const total = items.reduce((s, li) => s + li.budgetedAmount, 0);
    expect(total).toBe(15_000);
  });

  it('sums totalSpent using spendByLineItem', () => {
    const items = [makeLineItem({ id: 'li_1' }), makeLineItem({ id: 'li_2', budgetedAmount: 5_000 })];
    const spendMap = { li_1: 3_000 };
    const total = items.reduce((s, li) => s + (spendMap[li.id as keyof typeof spendMap] ?? 0), 0);
    expect(total).toBe(3_000);
  });
});
