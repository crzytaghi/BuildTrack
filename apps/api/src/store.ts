export type User = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
};

export type Session = {
  token: string;
  userId: string;
  expiresAt: number;
};

export type Project = {
  id: string;
  name: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed';
  startDate?: string;
  endDate?: string;
  budgetTotal?: number;
  notes?: string;
};

export type Task = {
  id: string;
  projectId: string;
  title: string;
  status: 'todo' | 'in_progress' | 'blocked' | 'done';
  dueDate?: string;
};

export type Expense = {
  id: string;
  projectId: string;
  amount: number;
  categoryId: string;
  description?: string;
  expenseDate: string;
};

export const db = {
  users: new Map<string, User>(),
  sessions: new Map<string, Session>(),
  projects: new Map<string, Project>(),
  tasks: new Map<string, Task>(),
  expenses: new Map<string, Expense>(),
};

export const resetDb = () => {
  db.users.clear();
  db.sessions.clear();
  db.projects.clear();
  db.tasks.clear();
  db.expenses.clear();
};

export const seed = () => {
  if (db.projects.size > 0) return;
  const project: Project = {
    id: 'proj_1',
    name: 'Maple St',
    status: 'active',
    startDate: '2026-02-01',
    budgetTotal: 420000,
  };
  db.projects.set(project.id, project);

  const task: Task = {
    id: 'task_1',
    projectId: project.id,
    title: 'Foundation pour',
    status: 'todo',
    dueDate: '2026-02-14',
  };
  db.tasks.set(task.id, task);

  const expense: Expense = {
    id: 'exp_1',
    projectId: project.id,
    amount: 12480,
    categoryId: 'cat_1',
    description: 'Concrete Supply Co.',
    expenseDate: '2026-02-10',
  };
  db.expenses.set(expense.id, expense);
};
