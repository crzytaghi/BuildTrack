import { useCallback, useEffect, useState } from 'react';
import { getApiBase } from '../lib/api';
import type { ExpenseItem, ProjectItem, VendorItem } from '../types';

const API_BASE = getApiBase();

export type ExpensesData = { expenses: ExpenseItem[]; projects: ProjectItem[]; vendors: VendorItem[] };

export const filterByProject = (expenses: ExpenseItem[], projectId: string): ExpenseItem[] =>
  expenses.filter((e) => e.projectId === projectId);

export const filterByDateRange = (expenses: ExpenseItem[], startDate: string, endDate: string): ExpenseItem[] =>
  expenses.filter((e) => {
    if (startDate && e.expenseDate < startDate) return false;
    if (endDate && e.expenseDate > endDate) return false;
    return true;
  });

export type UseExpensesResult = {
  data: ExpensesData | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => void;
};

export const useExpenses = (token: string): UseExpensesResult => {
  const [data, setData] = useState<ExpensesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [expensesRes, projectsRes, vendorsRes] = await Promise.all([
        fetch(`${API_BASE}/expenses`, { headers }),
        fetch(`${API_BASE}/projects`, { headers }),
        fetch(`${API_BASE}/vendors`, { headers }),
      ]);
      if (!expensesRes.ok) throw new Error('Unable to load expenses');
      const [expensesData, projectsData, vendorsData] = await Promise.all([
        expensesRes.json() as Promise<{ data: ExpenseItem[] }>,
        projectsRes.json() as Promise<{ data: ProjectItem[] }>,
        vendorsRes.json() as Promise<{ data: VendorItem[] }>,
      ]);
      setData({ expenses: expensesData.data, projects: projectsData.data, vendors: vendorsData.data });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load expenses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const refresh = useCallback(() => { fetchAll(true); }, [fetchAll]);

  return { data, loading, refreshing, error, refresh };
};
