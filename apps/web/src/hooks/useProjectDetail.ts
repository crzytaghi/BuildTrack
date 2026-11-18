import { useEffect, useState } from 'react';
import { getApiBase } from '../lib/api';
import { canManage } from '../lib/permissions';
import type { BudgetLineItem, Category, ExpenseItem, ProjectItem, QuoteItem, Role, TaskItem } from '../types/projects';

const API_BASE = getApiBase();

export interface ProjectDetailData {
  project:    ProjectItem | null;
  tasks:      TaskItem[];
  expenses:   ExpenseItem[];
  lineItems:  BudgetLineItem[];
  quotes:     QuoteItem[];
  vendors:    { id: string; name: string }[];
  categories: Category[];
  loading:    boolean;
  error:      string | null;
  setProject:    React.Dispatch<React.SetStateAction<ProjectItem | null>>;
  setTasks:      React.Dispatch<React.SetStateAction<TaskItem[]>>;
  setExpenses:   React.Dispatch<React.SetStateAction<ExpenseItem[]>>;
  setLineItems:  React.Dispatch<React.SetStateAction<BudgetLineItem[]>>;
  setQuotes:     React.Dispatch<React.SetStateAction<QuoteItem[]>>;
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
}

// Reads a list response, treating a failed request (e.g. 403 for field users) as empty.
const listOrEmpty = async <T,>(res: Response | null): Promise<T[]> => {
  if (!res || !res.ok) return [];
  const body = (await res.json()) as { data?: T[] };
  return body.data ?? [];
};

export const useProjectDetail = (projectId: string, token: string, role?: Role): ProjectDetailData => {
  const [project,    setProject]    = useState<ProjectItem | null>(null);
  const [tasks,      setTasks]      = useState<TaskItem[]>([]);
  const [expenses,   setExpenses]   = useState<ExpenseItem[]>([]);
  const [lineItems,  setLineItems]  = useState<BudgetLineItem[]>([]);
  const [quotes,     setQuotes]     = useState<QuoteItem[]>([]);
  const [vendors,    setVendors]    = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    // Budgets and quotes are owner/manager only; don't request them for field users.
    const loadBudget = canManage(role);
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [projectRes, tasksRes, expensesRes, lineItemsRes, vendorsRes, categoriesRes, quotesRes] = await Promise.all([
          fetch(`${API_BASE}/projects/${projectId}`,                  { headers }),
          fetch(`${API_BASE}/projects/${projectId}/tasks`,            { headers }),
          fetch(`${API_BASE}/projects/${projectId}/expenses`,         { headers }),
          loadBudget ? fetch(`${API_BASE}/projects/${projectId}/budget-line-items`, { headers }) : null,
          fetch(`${API_BASE}/vendors`,                                { headers }),
          fetch(`${API_BASE}/categories`,                             { headers }),
          loadBudget ? fetch(`${API_BASE}/projects/${projectId}/quotes`,           { headers }) : null,
        ]);

        if (!projectRes.ok) throw new Error('Unable to load project');

        const pd = (await projectRes.json()) as { data: ProjectItem };
        const [td, ed, ld, vd, cd, qd] = await Promise.all([
          listOrEmpty<TaskItem>(tasksRes),
          listOrEmpty<ExpenseItem>(expensesRes),
          listOrEmpty<BudgetLineItem>(lineItemsRes),
          listOrEmpty<{ id: string; name: string }>(vendorsRes),
          listOrEmpty<Category>(categoriesRes),
          listOrEmpty<QuoteItem>(quotesRes),
        ]);

        setProject(pd.data);
        setTasks(td);
        setExpenses(ed);
        setLineItems(ld);
        setVendors(vd);
        setCategories(cd);
        setQuotes(qd);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load project');
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId, token, role]);

  return { project, tasks, expenses, lineItems, quotes, vendors, categories, loading, error, setProject, setTasks, setExpenses, setLineItems, setQuotes, setCategories };
};
