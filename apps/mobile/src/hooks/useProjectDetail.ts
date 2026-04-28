import { useCallback, useEffect, useState } from 'react';
import { getApiBase } from '../lib/api';
import type { BudgetLineItem, Category, ExpenseItem, ProjectItem, TaskItem, VendorItem } from '../types';

const API_BASE = getApiBase();

export type UseProjectDetailResult = {
  project: ProjectItem | null;
  tasks: TaskItem[];
  expenses: ExpenseItem[];
  lineItems: BudgetLineItem[];
  vendors: VendorItem[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  setTasks: (tasks: TaskItem[]) => void;
  setExpenses: (expenses: ExpenseItem[]) => void;
  setLineItems: (items: BudgetLineItem[]) => void;
};

export const useProjectDetail = (projectId: string, token: string): UseProjectDetailResult => {
  const [project, setProject] = useState<ProjectItem | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [lineItems, setLineItems] = useState<BudgetLineItem[]>([]);
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [projectRes, tasksRes, expensesRes, lineItemsRes, vendorsRes, categoriesRes] =
        await Promise.all([
          fetch(`${API_BASE}/projects/${projectId}`, { headers }),
          fetch(`${API_BASE}/projects/${projectId}/tasks`, { headers }),
          fetch(`${API_BASE}/projects/${projectId}/expenses`, { headers }),
          fetch(`${API_BASE}/projects/${projectId}/budget-line-items`, { headers }),
          fetch(`${API_BASE}/vendors`, { headers }),
          fetch(`${API_BASE}/categories`, { headers }),
        ]);
      if (!projectRes.ok) throw new Error('Unable to load project');
      const [projectData, tasksData, expensesData, lineItemsData, vendorsData, categoriesData] =
        await Promise.all([
          projectRes.json() as Promise<{ data: ProjectItem }>,
          tasksRes.json() as Promise<{ data: TaskItem[] }>,
          expensesRes.json() as Promise<{ data: ExpenseItem[] }>,
          lineItemsRes.json() as Promise<{ data: BudgetLineItem[] }>,
          vendorsRes.json() as Promise<{ data: VendorItem[] }>,
          categoriesRes.json() as Promise<{ data: Category[] }>,
        ]);
      setProject(projectData.data);
      setTasks(tasksData.data);
      setExpenses(expensesData.data);
      setLineItems(lineItemsData.data);
      setVendors(vendorsData.data);
      setCategories(categoriesData.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load project');
    } finally {
      setLoading(false);
    }
  }, [projectId, token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const refresh = useCallback(() => { fetchAll(); }, [fetchAll]);

  return {
    project, tasks, expenses, lineItems, vendors, categories,
    loading, error, refresh,
    setTasks, setExpenses, setLineItems,
  };
};
