import { useEffect, useState } from 'react';
import { getApiBase } from '../lib/api';
import type { BudgetLineItem, Category, ExpenseItem, ProjectItem, QuoteItem, TaskItem } from '../types/projects';

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
  setProject:   React.Dispatch<React.SetStateAction<ProjectItem | null>>;
  setTasks:     React.Dispatch<React.SetStateAction<TaskItem[]>>;
  setExpenses:  React.Dispatch<React.SetStateAction<ExpenseItem[]>>;
  setLineItems: React.Dispatch<React.SetStateAction<BudgetLineItem[]>>;
  setQuotes:    React.Dispatch<React.SetStateAction<QuoteItem[]>>;
}

export const useProjectDetail = (projectId: string, token: string): ProjectDetailData => {
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
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [projectRes, tasksRes, expensesRes, lineItemsRes, vendorsRes, categoriesRes, quotesRes] = await Promise.all([
          fetch(`${API_BASE}/projects/${projectId}`,                  { headers }),
          fetch(`${API_BASE}/projects/${projectId}/tasks`,            { headers }),
          fetch(`${API_BASE}/projects/${projectId}/expenses`,         { headers }),
          fetch(`${API_BASE}/projects/${projectId}/budget-line-items`, { headers }),
          fetch(`${API_BASE}/vendors`,                                { headers }),
          fetch(`${API_BASE}/categories`,                             { headers }),
          fetch(`${API_BASE}/projects/${projectId}/quotes`,           { headers }),
        ]);

        if (!projectRes.ok) throw new Error('Unable to load project');

        const [pd, td, ed, ld, vd, cd, qd] = await Promise.all([
          projectRes.json()   as Promise<{ data: ProjectItem }>,
          tasksRes.json()     as Promise<{ data: TaskItem[] }>,
          expensesRes.json()  as Promise<{ data: ExpenseItem[] }>,
          lineItemsRes.json() as Promise<{ data: BudgetLineItem[] }>,
          vendorsRes.json()   as Promise<{ data: { id: string; name: string }[] }>,
          categoriesRes.json() as Promise<{ data: Category[] }>,
          quotesRes.json()    as Promise<{ data: QuoteItem[] }>,
        ]);

        setProject(pd.data);
        setTasks(td.data);
        setExpenses(ed.data);
        setLineItems(ld.data);
        setVendors(vd.data);
        setCategories(cd.data);
        setQuotes(qd.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load project');
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId, token]);

  return { project, tasks, expenses, lineItems, quotes, vendors, categories, loading, error, setProject, setTasks, setExpenses, setLineItems, setQuotes };
};
