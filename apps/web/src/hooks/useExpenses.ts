import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getApiBase } from '../lib/api';
import type { BudgetLineItem, ExpenseFormState, ExpenseItem, User } from '../types/projects';

const API_BASE = getApiBase();

export const useExpenses = (token: string | null, user: User | null) => {
  const location = useLocation();
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [expensesError, setExpensesError] = useState<string | null>(null);
  const [expenseFilters, setExpenseFilters] = useState({ projectId: '', categoryId: '', fromDate: '', toDate: '' });
  const [expenseForm, setExpenseForm] = useState<ExpenseFormState>({
    projectId: '', vendorId: '', description: '', amount: '', categoryId: '', expenseDate: '', lineItemId: '',
  });
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expenseCreateOpen, setExpenseCreateOpen] = useState(false);
  const [expenseSubmitAttempted, setExpenseSubmitAttempted] = useState(false);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);
  const [lineItems, setLineItems] = useState<BudgetLineItem[]>([]);

  // Load expenses on relevant pages — also covers /vendors since that view needs expense data for spend reporting
  useEffect(() => {
    if (!token || !user || (location.pathname !== '/expenses' && location.pathname !== '/' && location.pathname !== '/vendors')) return;
    if (location.pathname === '/expenses' && location.search) {
      const params = new URLSearchParams(location.search);
      const projectId = params.get('projectId') ?? '';
      if (projectId && projectId !== expenseFilters.projectId) {
        setExpenseFilters((prev) => ({ ...prev, projectId }));
      }
    }
    const loadExpenses = async () => {
      if (location.pathname === '/expenses') { setExpensesLoading(true); setExpensesError(null); }
      try {
        const params = new URLSearchParams();
        if (location.pathname === '/expenses') {
          if (expenseFilters.projectId) params.set('projectId', expenseFilters.projectId);
          if (expenseFilters.categoryId) params.set('categoryId', expenseFilters.categoryId);
          if (expenseFilters.fromDate) params.set('fromDate', expenseFilters.fromDate);
          if (expenseFilters.toDate) params.set('toDate', expenseFilters.toDate);
        }
        const res = await fetch(`${API_BASE}/expenses?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Unable to load expenses');
        const data = (await res.json()) as { data: ExpenseItem[] };
        setExpenses(data.data);
      } catch (err) {
        if (location.pathname === '/expenses')
          setExpensesError(err instanceof Error ? err.message : 'Unable to load expenses');
      } finally {
        if (location.pathname === '/expenses') setExpensesLoading(false);
      }
    };
    loadExpenses();
  }, [location.pathname, expenseFilters, token, user]);

  // Pre-load line items once for expense form dropdowns
  useEffect(() => {
    if (!token || !user || lineItems.length > 0) return;
    fetch(`${API_BASE}/budget-line-items`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data: { data: BudgetLineItem[] }) => setLineItems(data.data))
      .catch(() => null);
  }, [token, user, lineItems.length]);

  const resetExpenseForm = () => {
    setExpenseForm({ projectId: '', vendorId: '', description: '', amount: '', categoryId: '', expenseDate: '', lineItemId: '' });
    setEditingExpenseId(null);
    setExpenseSubmitAttempted(false);
  };

  const closeExpenseForm = () => { resetExpenseForm(); setExpenseCreateOpen(false); };

  const handleExpenseSubmit = async () => {
    if (!token) return;
    setExpenseSubmitAttempted(true);
    setExpensesError(null);
    if (!expenseForm.projectId) { setExpensesError('Project is required'); return; }
    if (!expenseForm.vendorId) { setExpensesError('Vendor is required'); return; }
    if (!expenseForm.description.trim()) { setExpensesError('Description is required'); return; }
    if (!expenseForm.amount || Number(expenseForm.amount) <= 0) { setExpensesError('A valid amount is required'); return; }
    if (!expenseForm.categoryId) { setExpensesError('Category is required'); return; }
    if (!expenseForm.expenseDate) { setExpensesError('Date is required'); return; }
    const method = editingExpenseId ? 'PATCH' : 'POST';
    const url = editingExpenseId
      ? `${API_BASE}/expenses/${editingExpenseId}`
      : `${API_BASE}/projects/${expenseForm.projectId}/expenses`;
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: Number(expenseForm.amount),
        categoryId: expenseForm.categoryId,
        vendorId: expenseForm.vendorId,
        description: expenseForm.description.trim(),
        expenseDate: expenseForm.expenseDate,
        lineItemId: expenseForm.lineItemId || undefined,
      }),
    });
    if (!res.ok) { setExpensesError('Unable to save expense'); return; }
    const data = (await res.json()) as { data: ExpenseItem };
    setExpenses((prev) =>
      editingExpenseId ? prev.map((item) => (item.id === data.data.id ? data.data : item)) : [data.data, ...prev]
    );
    closeExpenseForm();
  };

  const selectExpenseForEdit = (expense: ExpenseItem) => {
    setExpenseCreateOpen(true);
    setEditingExpenseId(expense.id);
    setExpenseForm({
      projectId: expense.projectId,
      vendorId: expense.vendorId,
      description: expense.description,
      amount: String(expense.amount),
      categoryId: expense.categoryId,
      expenseDate: expense.expenseDate,
      lineItemId: expense.lineItemId ?? '',
    });
  };

  const handleExpenseDelete = async (id: string) => {
    if (!token) return;
    await fetch(`${API_BASE}/expenses/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    setDeletingExpenseId(null);
  };

  const onCreateExpense = () => {
    setExpenseCreateOpen(true);
    setEditingExpenseId(null);
    setExpenseForm({ projectId: '', vendorId: '', description: '', amount: '', categoryId: '', expenseDate: '', lineItemId: '' });
    setExpenseSubmitAttempted(false);
  };

  return {
    expenses, expensesLoading, expensesError,
    expenseFilters, setExpenseFilters,
    expenseForm, setExpenseForm,
    editingExpenseId, expenseCreateOpen, setExpenseCreateOpen,
    expenseSubmitAttempted, deletingExpenseId, setDeletingExpenseId,
    lineItems,
    handleExpenseSubmit, handleExpenseDelete, selectExpenseForEdit,
    closeExpenseForm, onCreateExpense,
  };
};
