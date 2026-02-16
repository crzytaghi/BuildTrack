export type User = { id: string; email: string; name: string };

export type AuthResponse = { token: string; user: User };

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed';

export type ProjectItem = {
  id: string;
  name: string;
  status: ProjectStatus;
  startDate?: string;
  endDate?: string;
  budgetTotal?: number;
  notes?: string;
};

export type TaskItem = {
  id: string;
  projectId: string;
  title: string;
  status: 'todo' | 'in_progress' | 'blocked' | 'done';
  dueDate?: string;
};

export type ExpenseItem = {
  id: string;
  projectId: string;
  amount: number;
  categoryId: string;
  description?: string;
  expenseDate: string;
};
