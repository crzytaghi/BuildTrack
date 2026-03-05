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

export type ProjectFormState = {
  name: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  budgetTotal: string;
  notes: string;
};

export type TaskItem = {
  id: string;
  projectId: string;
  title: string;
  status: 'todo' | 'in_progress' | 'blocked' | 'done';
  dueDate?: string;
};

export type VendorItem = {
  id: string;
  name: string;
  trade?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  notes?: string;
};

export type VendorFormState = {
  name: string;
  trade: string;
  contactName: string;
  phone: string;
  email: string;
  notes: string;
};

export type ExpenseItem = {
  id: string;
  projectId: string;
  amount: number;
  categoryId: string;
  vendorId: string;
  description: string;
  expenseDate: string;
  lineItemId?: string;
};

export type Category = {
  id: string;
  name: string;
};

export type ExpenseFormState = {
  projectId: string;
  vendorId: string;
  description: string;
  amount: string;
  categoryId: string;
  expenseDate: string;
  lineItemId: string;
};

export type BudgetLineItem = {
  id: string;
  projectId: string;
  categoryId: string;
  description: string;
  budgetedAmount: number;
  notes?: string;
};

export type BudgetLineItemFormState = {
  projectId: string;
  categoryId: string;
  description: string;
  budgetedAmount: string;
  notes: string;
};

export type QuoteStatus = 'pending' | 'awarded' | 'rejected';

export type QuoteItem = {
  id: string;
  lineItemId: string;
  projectId: string;
  vendorId: string;
  amount: number;
  status: QuoteStatus;
  description?: string;
  expiresAt?: string;
  submittedAt: string;
};

export type QuoteFormState = {
  vendorId: string;
  amount: string;
  description: string;
  expiresAt: string;
  submittedAt: string;
};
