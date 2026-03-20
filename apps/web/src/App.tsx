import { useEffect, useState } from 'react';
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import AuthCard from './components/AuthCard';
import AuthLogin from './components/AuthLogin';
import AuthSignup from './components/AuthSignup';
import CompanySetupScreen from './components/CompanySetupScreen';
import DashboardView from './components/DashboardView';
import ProjectsView from './components/ProjectsView';
import ProjectDetailView from './components/ProjectDetailView';
import TasksView from './components/TasksView';
import ExpensesView from './components/ExpensesView';
import VendorsView from './components/VendorsView';
import BudgetView from './components/BudgetView';
import { getApiBase } from './lib/api';
import type { BudgetLineItem, BudgetLineItemFormState, Category, ExpenseFormState, ExpenseItem, ProjectFormState, ProjectItem, ProjectStatus, QuoteFormState, QuoteItem, TaskItem, VendorFormState, VendorItem } from './types/projects';

type User = { id: string; email: string; name: string };

type AuthResponse = { token: string; user: User };

const API_BASE = getApiBase();

const nav = [
  'Dashboard',
  'Projects',
  'Tasks',
  'Budget',
  'Expenses',
  'Vendors',
  'Documents',
  'Reports',
  'Settings',
];


const getStoredToken = () => localStorage.getItem('bt_token');

const AppShell = () => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [authLoading, setAuthLoading] = useState(true);
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [projectForm, setProjectForm] = useState<ProjectFormState>({
    name: '',
    status: 'planning' as ProjectStatus,
    startDate: '',
    endDate: '',
    budgetTotal: '',
    notes: '',
  });
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [companySetupRequired, setCompanySetupRequired] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [taskFilters, setTaskFilters] = useState({
    projectId: '',
    status: '',
    fromDate: '',
    toDate: '',
  });
  const [taskForm, setTaskForm] = useState({
    title: '',
    projectId: '',
    status: '' as TaskItem['status'] | '',
    dueDate: '',
  });
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskCreateOpen, setTaskCreateOpen] = useState(false);
  const [taskSubmitAttempted, setTaskSubmitAttempted] = useState(false);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [expensesError, setExpensesError] = useState<string | null>(null);
  const [expenseFilters, setExpenseFilters] = useState({
    projectId: '',
    categoryId: '',
    fromDate: '',
    toDate: '',
  });
  const [expenseForm, setExpenseForm] = useState<ExpenseFormState>({
    projectId: '',
    vendorId: '',
    description: '',
    amount: '',
    categoryId: '',
    expenseDate: '',
    lineItemId: '',
  });
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expenseCreateOpen, setExpenseCreateOpen] = useState(false);
  const [expenseSubmitAttempted, setExpenseSubmitAttempted] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [vendorsError, setVendorsError] = useState<string | null>(null);
  const [vendorForm, setVendorForm] = useState<VendorFormState>({
    name: '',
    trade: '',
    contactName: '',
    phone: '',
    email: '',
    notes: '',
  });
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  const [vendorCreateOpen, setVendorCreateOpen] = useState(false);
  const [vendorSubmitAttempted, setVendorSubmitAttempted] = useState(false);
  const [lineItems, setLineItems] = useState<BudgetLineItem[]>([]);
  const [lineItemsLoading, setLineItemsLoading] = useState(false);
  const [lineItemsError, setLineItemsError] = useState<string | null>(null);
  const [lineItemForm, setLineItemForm] = useState<BudgetLineItemFormState>({ projectId: '', categoryId: '', description: '', budgetedAmount: '', notes: '' });
  const [editingLineItemId, setEditingLineItemId] = useState<string | null>(null);
  const [lineItemCreateOpen, setLineItemCreateOpen] = useState(false);
  const [lineItemSubmitAttempted, setLineItemSubmitAttempted] = useState(false);
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [selectedLineItemId, setSelectedLineItemId] = useState<string | null>(null);
  const [quoteForm, setQuoteForm] = useState<QuoteFormState>({ vendorId: '', amount: '', description: '', expiresAt: '', submittedAt: '' });
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [quoteCreateOpen, setQuoteCreateOpen] = useState(false);
  const [quoteSubmitAttempted, setQuoteSubmitAttempted] = useState(false);
  const [budgetProjectFilter, setBudgetProjectFilter] = useState('');
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);
  const [deletingVendorId, setDeletingVendorId] = useState<string | null>(null);
  const [deletingLineItemId, setDeletingLineItemId] = useState<string | null>(null);
  const [deletingQuoteId, setDeletingQuoteId] = useState<string | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const currentToken = getStoredToken();
      if (!currentToken) {
        setAuthLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${currentToken}` },
        });
        if (!res.ok) throw new Error('Session expired');
        const data = (await res.json()) as { user: User };
        setUser(data.user);
        setToken(currentToken);
        const companyRes = await fetch(`${API_BASE}/company/me`, {
          headers: { Authorization: `Bearer ${currentToken}` },
        });
        if (companyRes.ok) {
          const companyData = (await companyRes.json()) as {
            company: { name: string; companySetupComplete: boolean } | null;
          };
          if (companyData.company?.companySetupComplete) {
            setCompanyName(companyData.company.name);
            setCompanySetupRequired(false);
          } else {
            setCompanySetupRequired(true);
          }
        }
      } catch {
        localStorage.removeItem('bt_token');
        setToken(null);
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!token || !user || (location.pathname !== '/' && location.pathname !== '/projects' && location.pathname !== '/tasks' && location.pathname !== '/expenses' && location.pathname !== '/vendors' && location.pathname !== '/budget')) return;
    const load = async () => {
      if (location.pathname === '/projects') {
        setProjectsLoading(true);
        setProjectsError(null);
      }
      try {
        const res = await fetch(`${API_BASE}/projects`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Unable to load projects');
        const data = (await res.json()) as { data: ProjectItem[] };
        setProjects(data.data);
      } catch (err) {
        setProjectsError(err instanceof Error ? err.message : 'Unable to load projects');
      } finally {
        if (location.pathname === '/projects') {
          setProjectsLoading(false);
        }
      }
    };
    load();
  }, [location.pathname, token, user]);

  useEffect(() => {
    if (!token || !user || (location.pathname !== '/tasks' && location.pathname !== '/')) return;
    if (location.pathname === '/tasks' && location.search) {
      const params = new URLSearchParams(location.search);
      const projectId = params.get('projectId') ?? '';
      if (projectId && projectId !== taskFilters.projectId) {
        setTaskFilters((prev) => ({ ...prev, projectId }));
      }
    }
    const loadTasks = async () => {
      if (location.pathname === '/tasks') {
        setTasksLoading(true);
        setTasksError(null);
      }
      try {
        const params = new URLSearchParams();
        if (location.pathname === '/tasks') {
          if (taskFilters.projectId) params.set('projectId', taskFilters.projectId);
          if (taskFilters.status) params.set('status', taskFilters.status);
          if (taskFilters.fromDate) params.set('fromDate', taskFilters.fromDate);
          if (taskFilters.toDate) params.set('toDate', taskFilters.toDate);
        }
        const res = await fetch(`${API_BASE}/tasks?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Unable to load tasks');
        const data = (await res.json()) as { data: TaskItem[] };
        setTasks(data.data);
      } catch (err) {
        if (location.pathname === '/tasks') setTasksError(err instanceof Error ? err.message : 'Unable to load tasks');
      } finally {
        if (location.pathname === '/tasks') setTasksLoading(false);
      }
    };
    loadTasks();
  }, [location.pathname, taskFilters, token, user]);

  useEffect(() => {
    if (!token || !user || (location.pathname !== '/expenses' && location.pathname !== '/')) return;
    if (location.pathname === '/expenses' && location.search) {
      const params = new URLSearchParams(location.search);
      const projectId = params.get('projectId') ?? '';
      if (projectId && projectId !== expenseFilters.projectId) {
        setExpenseFilters((prev) => ({ ...prev, projectId }));
      }
    }
    const loadExpenses = async () => {
      if (location.pathname === '/expenses') {
        setExpensesLoading(true);
        setExpensesError(null);
      }
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
        if (location.pathname === '/expenses') setExpensesError(err instanceof Error ? err.message : 'Unable to load expenses');
      } finally {
        if (location.pathname === '/expenses') setExpensesLoading(false);
      }
    };
    loadExpenses();
  }, [location.pathname, expenseFilters, token, user]);

  useEffect(() => {
    if (!token || !user || (location.pathname !== '/vendors' && location.pathname !== '/')) return;
    const loadVendors = async () => {
      if (location.pathname === '/vendors') {
        setVendorsLoading(true);
        setVendorsError(null);
      }
      try {
        const res = await fetch(`${API_BASE}/vendors`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Unable to load vendors');
        const data = (await res.json()) as { data: VendorItem[] };
        setVendors(data.data);
        const expRes = await fetch(`${API_BASE}/expenses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (expRes.ok) {
          const expData = (await expRes.json()) as { data: ExpenseItem[] };
          setExpenses(expData.data);
        }
      } catch (err) {
        if (location.pathname === '/vendors') setVendorsError(err instanceof Error ? err.message : 'Unable to load vendors');
      } finally {
        if (location.pathname === '/vendors') setVendorsLoading(false);
      }
    };
    loadVendors();
  }, [location.pathname, token, user]);

  useEffect(() => {
    if (!token || !user || location.pathname !== '/budget') return;
    if (location.search) {
      const params = new URLSearchParams(location.search);
      const projectId = params.get('projectId') ?? '';
      if (projectId && projectId !== budgetProjectFilter) {
        setBudgetProjectFilter(projectId);
      }
    }
    const loadLineItems = async () => {
      setLineItemsLoading(true);
      setLineItemsError(null);
      try {
        const res = await fetch(`${API_BASE}/budget-line-items`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Unable to load budget line items');
        const data = (await res.json()) as { data: BudgetLineItem[] };
        setLineItems(data.data);
      } catch (err) {
        setLineItemsError(err instanceof Error ? err.message : 'Unable to load budget line items');
      } finally {
        setLineItemsLoading(false);
      }
    };
    loadLineItems();
  }, [location.pathname, token, user]);

  useEffect(() => {
    if (!token || !user || location.pathname !== '/budget') return;
    setQuotes([]);
    if (!budgetProjectFilter) return;
    const loadQuotes = async () => {
      try {
        const res = await fetch(`${API_BASE}/projects/${budgetProjectFilter}/quotes`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = (await res.json()) as { data: QuoteItem[] };
        setQuotes(data.data);
      } catch {
        // silently fail
      }
    };
    loadQuotes();
  }, [budgetProjectFilter, location.pathname, token, user]);

  useEffect(() => {
    if (!token || !user || categories.length > 0) return;
    fetch(`${API_BASE}/categories`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data: { data: Category[] }) => setCategories(data.data))
      .catch(() => null);
  }, [token, user, categories.length]);

  useEffect(() => {
    if (!token || !user || vendors.length > 0) return;
    fetch(`${API_BASE}/vendors`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data: { data: VendorItem[] }) => setVendors(data.data))
      .catch(() => null);
  }, [token, user, vendors.length]);

  useEffect(() => {
    if (!token || !user || lineItems.length > 0) return;
    fetch(`${API_BASE}/budget-line-items`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data: { data: BudgetLineItem[] }) => setLineItems(data.data))
      .catch(() => null);
  }, [token, user, lineItems.length]);

  const handleAuth = async (path: 'login' | 'signup', payload: Record<string, string>) => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) throw new Error('Invalid credentials');
        if (res.status === 409) throw new Error('Email already in use');
        throw new Error(data.error ?? 'Authentication failed');
      }
      const data = (await res.json()) as AuthResponse;
      localStorage.setItem('bt_token', data.token);
      setToken(data.token);
      setUser(data.user);
      if (path === 'signup') {
        setCompanySetupRequired(true);
      }
    } catch (err) {
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        throw new Error('Unable to reach the API. Is it running on port 4000?');
      }
      throw err;
    }
  };

  const resetProjectForm = () => {
    setProjectForm({
      name: '',
      status: 'planning',
      startDate: '',
      endDate: '',
      budgetTotal: '',
      notes: '',
    });
  };

  const handleProjectSubmit = async () => {
    if (!token) return;
    setProjectsError(null);
    const payload = {
      name: projectForm.name.trim(),
      status: projectForm.status,
      startDate: projectForm.startDate || undefined,
      endDate: projectForm.endDate || undefined,
      budgetTotal: projectForm.budgetTotal ? Number(projectForm.budgetTotal) : undefined,
      notes: projectForm.notes || undefined,
    };
    if (!payload.name) {
      setProjectsError('Project name is required');
      return;
    }
    const url = `${API_BASE}/projects`;
    const method = 'POST';
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      setProjectsError('Unable to save project');
      return;
    }
    const data = (await res.json()) as { data: ProjectItem };
    setProjects((prev) => [data.data, ...prev]);
    resetProjectForm();
  };

  const resetTaskForm = () => {
    setTaskForm({ title: '', projectId: '', status: '', dueDate: '' });
    setEditingTaskId(null);
    setTaskSubmitAttempted(false);
  };
  const closeTaskForm = () => {
    resetTaskForm();
    setTaskCreateOpen(false);
  };

  const handleTaskSubmit = async () => {
    if (!token) return;
    setTaskSubmitAttempted(true);
    setTasksError(null);
    if (!taskForm.title.trim()) {
      setTasksError('Task title is required');
      return;
    }
    if (!taskForm.projectId) {
      setTasksError('Project is required');
      return;
    }
    if (!editingTaskId && (!taskForm.status || !taskForm.dueDate)) {
      setTasksError('All fields are required to create a task');
      return;
    }
    if (editingTaskId && !taskForm.status) {
      setTasksError('Status is required');
      return;
    }
    const method = editingTaskId ? 'PATCH' : 'POST';
    const url = editingTaskId
      ? `${API_BASE}/tasks/${editingTaskId}`
      : `${API_BASE}/projects/${taskForm.projectId}/tasks`;
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: taskForm.title.trim(),
        status: taskForm.status,
        dueDate: taskForm.dueDate || undefined,
      }),
    });
    if (!res.ok) {
      setTasksError('Unable to save task');
      return;
    }
    const data = (await res.json()) as { data: TaskItem };
    setTasks((prev) => {
      if (editingTaskId) {
        return prev.map((item) => (item.id === data.data.id ? data.data : item));
      }
      return [data.data, ...prev];
    });
    closeTaskForm();
  };

  const selectTaskForEdit = (task: TaskItem) => {
    setTaskCreateOpen(true);
    setEditingTaskId(task.id);
    setTaskForm({
      title: task.title,
      projectId: task.projectId,
      status: task.status,
      dueDate: task.dueDate ?? '',
    });
  };

  const resetExpenseForm = () => {
    setExpenseForm({ projectId: '', vendorId: '', description: '', amount: '', categoryId: '', expenseDate: '', lineItemId: '' });
    setEditingExpenseId(null);
    setExpenseSubmitAttempted(false);
  };
  const closeExpenseForm = () => {
    resetExpenseForm();
    setExpenseCreateOpen(false);
  };

  const handleExpenseSubmit = async () => {
    if (!token) return;
    setExpenseSubmitAttempted(true);
    setExpensesError(null);
    if (!expenseForm.projectId) {
      setExpensesError('Project is required');
      return;
    }
    if (!expenseForm.vendorId) {
      setExpensesError('Vendor is required');
      return;
    }
    if (!expenseForm.description.trim()) {
      setExpensesError('Description is required');
      return;
    }
    if (!expenseForm.amount || Number(expenseForm.amount) <= 0) {
      setExpensesError('A valid amount is required');
      return;
    }
    if (!expenseForm.categoryId) {
      setExpensesError('Category is required');
      return;
    }
    if (!expenseForm.expenseDate) {
      setExpensesError('Date is required');
      return;
    }
    const method = editingExpenseId ? 'PATCH' : 'POST';
    const url = editingExpenseId
      ? `${API_BASE}/expenses/${editingExpenseId}`
      : `${API_BASE}/projects/${expenseForm.projectId}/expenses`;
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Number(expenseForm.amount),
        categoryId: expenseForm.categoryId,
        vendorId: expenseForm.vendorId,
        description: expenseForm.description.trim(),
        expenseDate: expenseForm.expenseDate,
        lineItemId: expenseForm.lineItemId || undefined,
      }),
    });
    if (!res.ok) {
      setExpensesError('Unable to save expense');
      return;
    }
    const data = (await res.json()) as { data: ExpenseItem };
    setExpenses((prev) => {
      if (editingExpenseId) {
        return prev.map((item) => (item.id === data.data.id ? data.data : item));
      }
      return [data.data, ...prev];
    });
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

  const resetVendorForm = () => {
    setVendorForm({ name: '', trade: '', contactName: '', phone: '', email: '', notes: '' });
    setEditingVendorId(null);
    setVendorSubmitAttempted(false);
  };
  const closeVendorForm = () => {
    resetVendorForm();
    setVendorCreateOpen(false);
  };

  const handleVendorSubmit = async () => {
    if (!token) return;
    setVendorSubmitAttempted(true);
    setVendorsError(null);
    if (!vendorForm.name.trim()) {
      setVendorsError('Vendor name is required');
      return;
    }
    const method = editingVendorId ? 'PATCH' : 'POST';
    const url = editingVendorId
      ? `${API_BASE}/vendors/${editingVendorId}`
      : `${API_BASE}/vendors`;
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: vendorForm.name.trim(),
        trade: vendorForm.trade || undefined,
        contactName: vendorForm.contactName || undefined,
        phone: vendorForm.phone || undefined,
        email: vendorForm.email || undefined,
        notes: vendorForm.notes || undefined,
      }),
    });
    if (!res.ok) {
      setVendorsError('Unable to save vendor');
      return;
    }
    const data = (await res.json()) as { data: VendorItem };
    setVendors((prev) => {
      if (editingVendorId) {
        return prev.map((item) => (item.id === data.data.id ? data.data : item));
      }
      return [data.data, ...prev];
    });
    closeVendorForm();
  };

  const selectVendorForEdit = (vendor: VendorItem) => {
    setVendorCreateOpen(true);
    setEditingVendorId(vendor.id);
    setVendorForm({
      name: vendor.name,
      trade: vendor.trade ?? '',
      contactName: vendor.contactName ?? '',
      phone: vendor.phone ?? '',
      email: vendor.email ?? '',
      notes: vendor.notes ?? '',
    });
  };

  const resetLineItemForm = () => {
    setLineItemForm({ projectId: budgetProjectFilter, categoryId: '', description: '', budgetedAmount: '', notes: '' });
    setEditingLineItemId(null);
    setLineItemSubmitAttempted(false);
  };
  const closeLineItemForm = () => {
    resetLineItemForm();
    setLineItemCreateOpen(false);
  };

  const handleLineItemSubmit = async () => {
    if (!token) return;
    setLineItemSubmitAttempted(true);
    setLineItemsError(null);
    const projectId = editingLineItemId
      ? lineItems.find((li) => li.id === editingLineItemId)?.projectId ?? lineItemForm.projectId
      : lineItemForm.projectId;
    if (!projectId) { setLineItemsError('Project is required'); return; }
    if (!lineItemForm.categoryId) { setLineItemsError('Category is required'); return; }
    if (!lineItemForm.description.trim()) { setLineItemsError('Description is required'); return; }
    if (!lineItemForm.budgetedAmount || Number(lineItemForm.budgetedAmount) <= 0) { setLineItemsError('A valid budgeted amount is required'); return; }

    const method = editingLineItemId ? 'PATCH' : 'POST';
    const url = editingLineItemId
      ? `${API_BASE}/budget-line-items/${editingLineItemId}`
      : `${API_BASE}/projects/${projectId}/budget-line-items`;
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categoryId: lineItemForm.categoryId,
        description: lineItemForm.description.trim(),
        budgetedAmount: Number(lineItemForm.budgetedAmount),
        notes: lineItemForm.notes || undefined,
      }),
    });
    if (!res.ok) { setLineItemsError('Unable to save line item'); return; }
    const data = (await res.json()) as { data: BudgetLineItem };
    setLineItems((prev) => {
      if (editingLineItemId) return prev.map((item) => (item.id === data.data.id ? data.data : item));
      return [data.data, ...prev];
    });
    closeLineItemForm();
  };

  const selectLineItemForEdit = (item: BudgetLineItem) => {
    setLineItemCreateOpen(true);
    setEditingLineItemId(item.id);
    setLineItemForm({
      projectId: item.projectId,
      categoryId: item.categoryId,
      description: item.description,
      budgetedAmount: String(item.budgetedAmount),
      notes: item.notes ?? '',
    });
  };

  const resetQuoteForm = () => {
    setQuoteForm({ vendorId: '', amount: '', description: '', expiresAt: '', submittedAt: '' });
    setEditingQuoteId(null);
    setQuoteSubmitAttempted(false);
  };
  const closeQuoteForm = () => {
    resetQuoteForm();
    setQuoteCreateOpen(false);
  };

  const handleQuoteSubmit = async () => {
    if (!token) return;
    setQuoteSubmitAttempted(true);
    if (!quoteForm.vendorId) return;
    if (!quoteForm.amount || Number(quoteForm.amount) <= 0) return;
    if (!quoteForm.submittedAt) return;

    const method = editingQuoteId ? 'PATCH' : 'POST';
    const url = editingQuoteId
      ? `${API_BASE}/quotes/${editingQuoteId}`
      : `${API_BASE}/budget-line-items/${selectedLineItemId}/quotes`;
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vendorId: quoteForm.vendorId,
        amount: Number(quoteForm.amount),
        submittedAt: quoteForm.submittedAt,
        description: quoteForm.description || undefined,
        expiresAt: quoteForm.expiresAt || undefined,
      }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { data: QuoteItem };
    setQuotes((prev) => {
      if (editingQuoteId) return prev.map((q) => (q.id === data.data.id ? data.data : q));
      return [data.data, ...prev];
    });
    closeQuoteForm();
  };

  const selectQuoteForEdit = (quote: QuoteItem) => {
    setQuoteCreateOpen(true);
    setEditingQuoteId(quote.id);
    setQuoteForm({
      vendorId: quote.vendorId,
      amount: String(quote.amount),
      description: quote.description ?? '',
      expiresAt: quote.expiresAt ?? '',
      submittedAt: quote.submittedAt,
    });
  };

  const handleAwardQuote = async (quoteId: string) => {
    if (!token || !budgetProjectFilter) return;
    const res = await fetch(`${API_BASE}/quotes/${quoteId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'awarded' }),
    });
    if (!res.ok) return;
    const refreshRes = await fetch(`${API_BASE}/projects/${budgetProjectFilter}/quotes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (refreshRes.ok) {
      const data = (await refreshRes.json()) as { data: QuoteItem[] };
      setQuotes(data.data);
    }
  };

  const handleTaskDelete = async (id: string) => {
    if (!token) return;
    await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setDeletingTaskId(null);
  };

  const handleExpenseDelete = async (id: string) => {
    if (!token) return;
    await fetch(`${API_BASE}/expenses/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    setDeletingExpenseId(null);
  };

  const handleVendorDelete = async (id: string) => {
    if (!token) return;
    await fetch(`${API_BASE}/vendors/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setVendors((prev) => prev.filter((v) => v.id !== id));
    setDeletingVendorId(null);
  };

  const handleLineItemDelete = async (id: string) => {
    if (!token) return;
    await fetch(`${API_BASE}/budget-line-items/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setLineItems((prev) => prev.filter((li) => li.id !== id));
    setQuotes((prev) => prev.filter((q) => q.lineItemId !== id));
    if (selectedLineItemId === id) setSelectedLineItemId(null);
    setDeletingLineItemId(null);
  };

  const handleQuoteDelete = async (id: string) => {
    if (!token) return;
    await fetch(`${API_BASE}/quotes/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setQuotes((prev) => prev.filter((q) => q.id !== id));
    setDeletingQuoteId(null);
  };

  const handleProjectDelete = async (id: string) => {
    if (!token) return;
    await fetch(`${API_BASE}/projects/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setDeletingProjectId(null);
    navigate('/projects');
  };

  const handleLogout = async () => {
    if (token) {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null);
    }
    localStorage.removeItem('bt_token');
    setUser(null);
    setToken(null);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink text-slate-200">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-ink text-slate-100">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,#1e293b,transparent_55%)]" />
        <div className="mx-auto flex min-h-screen w-full max-w-lg items-center justify-center px-6">
          <AuthCard
            title="BuildTrack"
            subtitle="Sign in to manage projects, budgets, and expenses."
            authView={authView}
            setAuthView={setAuthView}
            clearError={() => setError(null)}
            clearLoginFields={() => {
              setLoginEmail('');
              setLoginPassword('');
            }}
            clearSignupFields={() => {
              setSignupName('');
              setSignupEmail('');
              setSignupPassword('');
              setSignupConfirmPassword('');
            }}
            error={error}
          >
            {authView === 'login' ? (
              <AuthLogin
                email={loginEmail}
                password={loginPassword}
                onEmailChange={setLoginEmail}
                onPasswordChange={setLoginPassword}
                onSubmit={async () => {
                  try {
                    await handleAuth('login', { email: loginEmail, password: loginPassword });
                    setLoginEmail('');
                    setLoginPassword('');
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Login failed');
                  }
                }}
              />
            ) : (
              <AuthSignup
                name={signupName}
                email={signupEmail}
                password={signupPassword}
                confirmPassword={signupConfirmPassword}
                onNameChange={setSignupName}
                onEmailChange={setSignupEmail}
                onPasswordChange={setSignupPassword}
                onConfirmPasswordChange={setSignupConfirmPassword}
                onSubmit={async () => {
                  try {
                    if (signupPassword !== signupConfirmPassword) {
                      setError('Passwords do not match');
                      return;
                    }
                    await handleAuth('signup', {
                      name: signupName,
                      email: signupEmail,
                      password: signupPassword,
                    });
                    setSignupName('');
                    setSignupEmail('');
                    setSignupPassword('');
                    setSignupConfirmPassword('');
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Signup failed');
                  }
                }}
              />
            )}
          </AuthCard>
        </div>
      </div>
    );
  }

  if (companySetupRequired) {
    return (
      <CompanySetupScreen
        onSubmit={async (name) => {
          const res = await fetch(`${API_BASE}/company/setup`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name }),
          });
          if (!res.ok) {
            return;
          }
          const data = (await res.json()) as {
            company: { name: string; companySetupComplete: boolean };
          };
          setCompanyName(data.company.name);
          setCompanySetupRequired(false);
        }}
      />
    );
  }

  const fmtCompact = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 });

  const totalBudget = projects.reduce((sum, p) => sum + (p.budgetTotal ?? 0), 0);
  const totalSpend = expenses.reduce((sum, e) => sum + e.amount, 0);
  const variance = totalBudget - totalSpend;
  const activeProjects = projects.filter((p) => p.status === 'active').length;

  const kpis = [
    { label: 'Total Budget', value: fmtCompact.format(totalBudget), tone: 'bg-emerald-400' },
    { label: 'Actual Spend', value: fmtCompact.format(totalSpend), tone: 'bg-amber-400' },
    { label: 'Variance', value: fmtCompact.format(variance), tone: variance >= 0 ? 'bg-sky-400' : 'bg-red-400' },
    { label: 'Active Projects', value: String(activeProjects), tone: 'bg-violet-400' },
  ];

  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysOut = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const tasksDueSoon = tasks
    .filter((t) => t.status !== 'done' && t.dueDate && t.dueDate >= today && t.dueDate <= sevenDaysOut)
    .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
    .slice(0, 5)
    .map((t) => ({ ...t, projectName: projects.find((p) => p.id === t.projectId)?.name ?? 'Unknown Project' }));

  const recentExpenses = [...expenses]
    .sort((a, b) => b.expenseDate.localeCompare(a.expenseDate))
    .slice(0, 5)
    .map((e) => ({
      ...e,
      vendorName: vendors.find((v) => v.id === e.vendorId)?.name ?? 'Unknown Vendor',
      projectName: projects.find((p) => p.id === e.projectId)?.name ?? 'Unknown Project',
    }));

  const spendByProject = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.projectId] = (acc[e.projectId] ?? 0) + e.amount;
    return acc;
  }, {});

  const projectSpendData = projects
    .filter((p) => (p.budgetTotal ?? 0) > 0 || spendByProject[p.id])
    .map((p) => ({ name: p.name, budget: p.budgetTotal ?? 0, actual: spendByProject[p.id] ?? 0 }));

  return (
    <div className="min-h-screen bg-ink text-slate-100">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,#1e293b,transparent_55%)]" />
      <div className="md:grid md:h-screen md:grid-cols-[260px_1fr]">
        <aside className="hidden h-full flex-col border-r border-slate-800 bg-[#0b1118] p-6 md:flex">
          <div>
            <div className="text-xl font-semibold tracking-tight font-display">BuildTrack</div>
            <div className="mt-10 space-y-2 text-sm">
              {nav.map((item) => (
                <Link
                  key={item}
                  to={item === 'Dashboard' ? '/' : `/${item.toLowerCase()}`}
                  className={`block rounded-lg px-3 py-2 ${
                    (item === 'Dashboard' && location.pathname === '/') ||
                    (item === 'Projects' && location.pathname.startsWith('/projects')) ||
                    (item !== 'Dashboard' && item !== 'Projects' && location.pathname === `/${item.toLowerCase()}`)
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400'
                  }`}
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>
          <button
            className="mt-auto rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200"
            onClick={handleLogout}
          >
            Log out
          </button>
        </aside>
        <main className="overflow-y-auto md:h-full">
          <div className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-800 bg-[#0b1118] px-4 py-4 md:hidden">
            <button
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200"
              onClick={() => setMobileNavOpen(true)}
            >
              ☰
            </button>
            <div className="text-lg font-semibold font-display">BuildTrack</div>
            <div className="w-[40px]" />
          </div>
          {mobileNavOpen && (
            <div className="fixed inset-0 z-50 md:hidden">
              <button
                className="absolute inset-0 bg-black/50"
                onClick={() => setMobileNavOpen(false)}
              />
              <aside className="absolute left-0 top-0 h-full w-72 flex flex-col bg-[#0b1118] p-6 shadow-2xl">
                <div>
                  <div className="text-xl font-semibold tracking-tight font-display">BuildTrack</div>
                  <div className="mt-8 space-y-2 text-sm">
                    {nav.map((item) => (
                      <Link
                        key={item}
                        to={item === 'Dashboard' ? '/' : `/${item.toLowerCase()}`}
                        onClick={() => setMobileNavOpen(false)}
                        className={`block rounded-lg px-3 py-2 ${
                          (item === 'Dashboard' && location.pathname === '/') ||
                          (item === 'Projects' && location.pathname.startsWith('/projects')) ||
                          (item !== 'Dashboard' && item !== 'Projects' && location.pathname === `/${item.toLowerCase()}`)
                            ? 'bg-slate-800 text-white'
                            : 'text-slate-400'
                        }`}
                      >
                        {item}
                      </Link>
                    ))}
                  </div>
                </div>
                <button
                  className="mt-auto rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200"
                  onClick={() => {
                    setMobileNavOpen(false);
                    handleLogout();
                  }}
                >
                  Log out
                </button>
              </aside>
            </div>
          )}
          <Routes>
            <Route
              path="/"
              element={
                <DashboardView
                  userName={user?.name ?? 'Builder'}
                  companyName={companyName ?? 'Company'}
                  kpis={kpis}
                  tasksDueSoon={tasksDueSoon}
                  recentExpenses={recentExpenses}
                  projectSpendData={projectSpendData}
                  headerActions={
                    <button className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-slate-950 shadow">
                      Export CSV
                    </button>
                  }
                />
              }
            />
            <Route
              path="/projects"
              element={
                <ProjectsView
                  projects={projects}
                  loading={projectsLoading}
                  error={projectsError}
                  form={projectForm}
                  onFormChange={setProjectForm}
                  onSubmit={handleProjectSubmit}
                  onViewProject={(id) => navigate(`/projects/${id}`)}
                />
              }
            />
            <Route
              path="/projects/:id"
              element={
                <ProjectDetailRoute
                  token={token ?? ''}
                  deletingProjectId={deletingProjectId}
                  onRequestDeleteProject={setDeletingProjectId}
                  onDeleteProject={handleProjectDelete}
                />
              }
            />
            <Route
              path="/expenses"
              element={
                <ExpensesView
                  projects={projects}
                  expenses={expenses}
                  categories={categories}
                  vendors={vendors}
                  budgetLineItems={lineItems}
                  loading={expensesLoading}
                  error={expensesError}
                  filters={expenseFilters}
                  form={expenseForm}
                  createOpen={expenseCreateOpen || Boolean(editingExpenseId)}
                  submitAttempted={expenseSubmitAttempted}
                  editingExpenseId={editingExpenseId}
                  onFilterChange={setExpenseFilters}
                  onFormChange={setExpenseForm}
                  onCreateExpense={() => {
                    setExpenseCreateOpen(true);
                    setEditingExpenseId(null);
                    setExpenseForm({ projectId: '', vendorId: '', description: '', amount: '', categoryId: '', expenseDate: '', lineItemId: '' });
                    setExpenseSubmitAttempted(false);
                  }}
                  onSubmit={handleExpenseSubmit}
                  onCancelEdit={closeExpenseForm}
                  onEditExpense={selectExpenseForEdit}
                  deletingExpenseId={deletingExpenseId}
                  onRequestDeleteExpense={setDeletingExpenseId}
                  onDeleteExpense={handleExpenseDelete}
                />
              }
            />
            <Route
              path="/tasks"
              element={
                <TasksView
                  projects={projects}
                  tasks={tasks}
                  loading={tasksLoading}
                  error={tasksError}
                  filters={taskFilters}
                  form={taskForm}
                  createOpen={taskCreateOpen || Boolean(editingTaskId)}
                  submitAttempted={taskSubmitAttempted}
                  editingTaskId={editingTaskId}
                  onFilterChange={(next) => {
                    setTaskFilters(next);
                    const params = new URLSearchParams();
                    if (next.projectId) params.set('projectId', next.projectId);
                    if (next.status) params.set('status', next.status);
                    if (next.fromDate) params.set('fromDate', next.fromDate);
                    if (next.toDate) params.set('toDate', next.toDate);
                    navigate({ pathname: '/tasks', search: params.size ? `?${params.toString()}` : '' }, { replace: true });
                  }}
                  onFormChange={setTaskForm}
                  onCreateTask={() => {
                    setTaskCreateOpen(true);
                    setEditingTaskId(null);
                    setTaskForm({ title: '', projectId: '', status: '', dueDate: '' });
                    setTaskSubmitAttempted(false);
                  }}
                  onSubmit={handleTaskSubmit}
                  onCancelEdit={closeTaskForm}
                  onEditTask={selectTaskForEdit}
                  deletingTaskId={deletingTaskId}
                  onRequestDeleteTask={setDeletingTaskId}
                  onDeleteTask={handleTaskDelete}
                />
              }
            />
            <Route
              path="/vendors"
              element={
                <VendorsView
                  vendors={vendors}
                  expenses={expenses}
                  projects={projects}
                  loading={vendorsLoading}
                  error={vendorsError}
                  form={vendorForm}
                  editingVendorId={editingVendorId}
                  createOpen={vendorCreateOpen || Boolean(editingVendorId)}
                  submitAttempted={vendorSubmitAttempted}
                  onFormChange={setVendorForm}
                  onCreateVendor={() => {
                    setVendorCreateOpen(true);
                    setEditingVendorId(null);
                    setVendorForm({ name: '', trade: '', contactName: '', phone: '', email: '', notes: '' });
                    setVendorSubmitAttempted(false);
                  }}
                  onSubmit={handleVendorSubmit}
                  onCancelEdit={closeVendorForm}
                  onEditVendor={selectVendorForEdit}
                  deletingVendorId={deletingVendorId}
                  onRequestDeleteVendor={setDeletingVendorId}
                  onDeleteVendor={handleVendorDelete}
                />
              }
            />
            <Route
              path="/budget"
              element={
                <BudgetView
                  projects={projects}
                  lineItems={lineItems}
                  quotes={quotes}
                  categories={categories}
                  vendors={vendors}
                  expenses={expenses}
                  loading={lineItemsLoading}
                  error={lineItemsError}
                  selectedProjectId={budgetProjectFilter}
                  selectedLineItemId={selectedLineItemId}
                  lineItemForm={lineItemForm}
                  lineItemCreateOpen={lineItemCreateOpen || Boolean(editingLineItemId)}
                  lineItemSubmitAttempted={lineItemSubmitAttempted}
                  editingLineItemId={editingLineItemId}
                  quoteForm={quoteForm}
                  quoteCreateOpen={quoteCreateOpen || Boolean(editingQuoteId)}
                  quoteSubmitAttempted={quoteSubmitAttempted}
                  editingQuoteId={editingQuoteId}
                  onProjectFilterChange={(id) => {
                    setBudgetProjectFilter(id);
                    setSelectedLineItemId(null);
                    closeLineItemForm();
                    closeQuoteForm();
                  }}
                  onSelectLineItem={(id) => {
                    setSelectedLineItemId(id);
                    closeQuoteForm();
                  }}
                  onLineItemFormChange={setLineItemForm}
                  onCreateLineItem={() => {
                    setLineItemCreateOpen(true);
                    setEditingLineItemId(null);
                    setLineItemForm({ projectId: budgetProjectFilter, categoryId: '', description: '', budgetedAmount: '', notes: '' });
                    setLineItemSubmitAttempted(false);
                  }}
                  onLineItemSubmit={handleLineItemSubmit}
                  onLineItemCancelEdit={closeLineItemForm}
                  onEditLineItem={selectLineItemForEdit}
                  onQuoteFormChange={setQuoteForm}
                  onCreateQuote={() => {
                    setQuoteCreateOpen(true);
                    setEditingQuoteId(null);
                    setQuoteForm({ vendorId: '', amount: '', description: '', expiresAt: '', submittedAt: '' });
                    setQuoteSubmitAttempted(false);
                  }}
                  onQuoteSubmit={handleQuoteSubmit}
                  onQuoteCancelEdit={closeQuoteForm}
                  onAwardQuote={handleAwardQuote}
                  onEditQuote={selectQuoteForEdit}
                  deletingLineItemId={deletingLineItemId}
                  onRequestDeleteLineItem={setDeletingLineItemId}
                  onDeleteLineItem={handleLineItemDelete}
                  deletingQuoteId={deletingQuoteId}
                  onRequestDeleteQuote={setDeletingQuoteId}
                  onDeleteQuote={handleQuoteDelete}
                />
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const ProjectDetailRoute = ({
  token,
  deletingProjectId,
  onRequestDeleteProject,
  onDeleteProject,
}: {
  token: string;
  deletingProjectId: string | null;
  onRequestDeleteProject: (id: string | null) => void;
  onDeleteProject: (id: string) => void;
}) => {
  const { id } = useParams();
  if (!id) return null;
  return (
    <ProjectDetailView
      projectId={id}
      token={token}
      deletingProjectId={deletingProjectId}
      onRequestDeleteProject={onRequestDeleteProject}
      onDeleteProject={onDeleteProject}
    />
  );
};

const App = () => (
  <BrowserRouter>
    <AppShell />
  </BrowserRouter>
);

export default App;
