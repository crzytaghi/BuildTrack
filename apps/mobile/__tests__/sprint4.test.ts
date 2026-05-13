import { filterByProject, filterByDateRange } from '../src/hooks/useExpenses';
import { computeVendorSpend } from '../src/hooks/useVendors';
import type { ExpenseItem, VendorItem } from '../src/types';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const makeExpense = (overrides: Partial<ExpenseItem> = {}): ExpenseItem => ({
  id: 'exp_1',
  projectId: 'proj_1',
  vendorId: 'vendor_1',
  amount: 500,
  categoryId: 'cat_1',
  description: 'Lumber',
  expenseDate: '2026-03-15',
  ...overrides,
});

const makeVendor = (overrides: Partial<VendorItem> = {}): VendorItem => ({
  id: 'vendor_1',
  name: 'Acme Supplies',
  ...overrides,
});

// ─── filterByProject ─────────────────────────────────────────────────────────

describe('filterByProject', () => {
  it('returns only expenses matching the projectId', () => {
    const expenses = [
      makeExpense({ id: 'e1', projectId: 'proj_1' }),
      makeExpense({ id: 'e2', projectId: 'proj_2' }),
      makeExpense({ id: 'e3', projectId: 'proj_1' }),
    ];
    const result = filterByProject(expenses, 'proj_1');
    expect(result).toHaveLength(2);
    expect(result.every((e) => e.projectId === 'proj_1')).toBe(true);
  });

  it('returns empty array when no expenses match', () => {
    const expenses = [makeExpense({ projectId: 'proj_2' })];
    expect(filterByProject(expenses, 'proj_1')).toHaveLength(0);
  });

  it('returns all expenses when all match', () => {
    const expenses = [makeExpense(), makeExpense({ id: 'e2' })];
    expect(filterByProject(expenses, 'proj_1')).toHaveLength(2);
  });
});

// ─── filterByDateRange ───────────────────────────────────────────────────────

describe('filterByDateRange', () => {
  const expenses = [
    makeExpense({ id: 'e1', expenseDate: '2026-01-01' }),
    makeExpense({ id: 'e2', expenseDate: '2026-03-15' }),
    makeExpense({ id: 'e3', expenseDate: '2026-06-30' }),
  ];

  it('filters expenses on or after startDate', () => {
    const result = filterByDateRange(expenses, '2026-03-01', '');
    expect(result.map((e) => e.id)).toEqual(['e2', 'e3']);
  });

  it('filters expenses on or before endDate', () => {
    const result = filterByDateRange(expenses, '', '2026-03-31');
    expect(result.map((e) => e.id)).toEqual(['e1', 'e2']);
  });

  it('filters expenses within a date range', () => {
    const result = filterByDateRange(expenses, '2026-02-01', '2026-05-01');
    expect(result.map((e) => e.id)).toEqual(['e2']);
  });

  it('includes expenses exactly on startDate', () => {
    const result = filterByDateRange(expenses, '2026-01-01', '');
    expect(result).toHaveLength(3);
  });

  it('includes expenses exactly on endDate', () => {
    const result = filterByDateRange(expenses, '', '2026-06-30');
    expect(result).toHaveLength(3);
  });

  it('returns all when both dates are empty', () => {
    expect(filterByDateRange(expenses, '', '')).toHaveLength(3);
  });
});

// ─── computeVendorSpend ──────────────────────────────────────────────────────

describe('computeVendorSpend', () => {
  it('sums totalSpend and expenseCount per vendor', () => {
    const vendors = [makeVendor({ id: 'v1' }), makeVendor({ id: 'v2', name: 'BuildCo' })];
    const expenses = [
      makeExpense({ vendorId: 'v1', amount: 1_000 }),
      makeExpense({ vendorId: 'v1', amount: 500 }),
      makeExpense({ vendorId: 'v2', amount: 2_000 }),
    ];
    const result = computeVendorSpend(vendors, expenses);
    const v1 = result.find((v) => v.id === 'v1')!;
    const v2 = result.find((v) => v.id === 'v2')!;
    expect(v1.totalSpend).toBe(1_500);
    expect(v1.expenseCount).toBe(2);
    expect(v2.totalSpend).toBe(2_000);
    expect(v2.expenseCount).toBe(1);
  });

  it('returns 0 spend for vendors with no expenses', () => {
    const vendors = [makeVendor({ id: 'v1' })];
    const result = computeVendorSpend(vendors, []);
    expect(result[0].totalSpend).toBe(0);
    expect(result[0].expenseCount).toBe(0);
  });

  it('preserves all vendor fields', () => {
    const vendor = makeVendor({ id: 'v1', name: 'Acme', trade: 'Electrical', contactName: 'Bob' });
    const result = computeVendorSpend([vendor], []);
    expect(result[0].name).toBe('Acme');
    expect(result[0].trade).toBe('Electrical');
    expect(result[0].contactName).toBe('Bob');
  });

  it('returns empty array for no vendors', () => {
    expect(computeVendorSpend([], [])).toEqual([]);
  });
});
