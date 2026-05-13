import { useCallback, useEffect, useState } from 'react';
import { getApiBase } from '../lib/api';
import type { ExpenseItem, VendorItem } from '../types';

const API_BASE = getApiBase();

export type VendorWithSpend = VendorItem & { totalSpend: number; expenseCount: number };

export const computeVendorSpend = (vendors: VendorItem[], expenses: ExpenseItem[]): VendorWithSpend[] => {
  const spendMap: Record<string, { total: number; count: number }> = {};
  expenses.forEach((e) => {
    if (!spendMap[e.vendorId]) spendMap[e.vendorId] = { total: 0, count: 0 };
    spendMap[e.vendorId].total += Number(e.amount);
    spendMap[e.vendorId].count += 1;
  });
  return vendors.map((v) => ({
    ...v,
    totalSpend: spendMap[v.id]?.total ?? 0,
    expenseCount: spendMap[v.id]?.count ?? 0,
  }));
};

export type UseVendorsResult = {
  vendors: VendorWithSpend[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => void;
};

export const useVendors = (token: string): UseVendorsResult => {
  const [vendors, setVendors] = useState<VendorWithSpend[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [vendorsRes, expensesRes] = await Promise.all([
        fetch(`${API_BASE}/vendors`, { headers }),
        fetch(`${API_BASE}/expenses`, { headers }),
      ]);
      if (!vendorsRes.ok) throw new Error('Unable to load vendors');
      const [vendorsData, expensesData] = await Promise.all([
        vendorsRes.json() as Promise<{ data: VendorItem[] }>,
        expensesRes.json() as Promise<{ data: ExpenseItem[] }>,
      ]);
      setVendors(computeVendorSpend(vendorsData.data, expensesData.data));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load vendors');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const refresh = useCallback(() => { fetchAll(true); }, [fetchAll]);

  return { vendors, loading, refreshing, error, refresh };
};
