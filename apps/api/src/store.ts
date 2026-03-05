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

export type Vendor = {
  id: string;
  name: string;
  trade?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  notes?: string;
};

export type Expense = {
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

export type BudgetLineItem = {
  id: string;
  projectId: string;
  categoryId: string;
  description: string;
  budgetedAmount: number;
  notes?: string;
};

export type Quote = {
  id: string;
  lineItemId: string;
  projectId: string;
  vendorId: string;
  amount: number;
  status: 'pending' | 'awarded' | 'rejected';
  description?: string;
  expiresAt?: string;
  submittedAt: string;
};

export const db = {
  users: new Map<string, User>(),
  sessions: new Map<string, Session>(),
  projects: new Map<string, Project>(),
  tasks: new Map<string, Task>(),
  expenses: new Map<string, Expense>(),
  categories: new Map<string, Category>(),
  vendors: new Map<string, Vendor>(),
  budgetLineItems: new Map<string, BudgetLineItem>(),
  quotes: new Map<string, Quote>(),
};

export const resetDb = () => {
  db.users.clear();
  db.sessions.clear();
  db.projects.clear();
  db.tasks.clear();
  db.expenses.clear();
  db.categories.clear();
  db.vendors.clear();
  db.budgetLineItems.clear();
  db.quotes.clear();
};

export const seed = () => {
  if (db.projects.size > 0) return;

  const TASK_TITLES = [
    'Site survey', 'Permit submission', 'Demolition - interior walls',
    'Foundation pour', 'Concrete curing', 'Steel beam installation',
    'Framing - first floor', 'Framing - second floor', 'Roofing',
    'Electrical rough-in', 'Plumbing rough-in', 'HVAC installation',
    'Insulation', 'Drywall installation', 'Window installation',
    'Door installation', 'MEP coordination', 'Waterproofing',
    'Masonry work', 'Stucco application', 'Flooring - tile',
    'Flooring - hardwood', 'Cabinet installation', 'Countertop installation',
    'Painting - interior', 'Painting - exterior', 'Trim and finish work',
    'Landscaping', 'Parking lot paving', 'Security system installation',
    'Fire suppression system', 'Utility connections', 'Engineering review',
    'Final inspection', 'Owner walkthrough', 'Final punch list',
    'Certificate of occupancy', 'Project closeout', 'Signage installation',
    'Elevator shaft rough-in',
  ];

  const STATUSES: Task['status'][] = ['todo', 'in_progress', 'blocked', 'done'];

  const projects: Omit<Project, 'id'>[] = [
    { name: 'Maple St Renovation',     status: 'active',    startDate: '2026-01-15', budgetTotal: 420000 },
    { name: 'Harbor View Condos',       status: 'active',    startDate: '2025-11-01', budgetTotal: 2800000 },
    { name: 'Downtown Office Complex',  status: 'planning',  startDate: '2026-04-01', budgetTotal: 5100000 },
    { name: 'Riverside Warehouse',      status: 'on_hold',   startDate: '2025-09-15', budgetTotal: 875000 },
    { name: 'Elmwood Medical Center',   status: 'active',    startDate: '2026-02-01', budgetTotal: 9200000 },
    { name: 'Sunset Retail Strip',      status: 'planning',  startDate: '2026-06-01', budgetTotal: 1350000 },
    { name: 'Lakeshore Apartments',     status: 'completed', startDate: '2025-03-01', endDate: '2025-12-20', budgetTotal: 3400000 },
    { name: 'Tech Park Building B',     status: 'active',    startDate: '2026-01-05', budgetTotal: 6750000 },
  ];

  const taskCounts = [12, 5, 38, 21, 9, 40, 17, 28];

  projects.forEach((def, i) => {
    const projectId = `proj_${i + 1}`;
    db.projects.set(projectId, { id: projectId, ...def });

    for (let t = 0; t < taskCounts[i]; t++) {
      const taskId = `task_${projectId}_${t + 1}`;
      db.tasks.set(taskId, {
        id: taskId,
        projectId,
        title: TASK_TITLES[t % TASK_TITLES.length],
        status: STATUSES[t % STATUSES.length],
        dueDate: `2026-0${(t % 9) + 1}-${String((t % 28) + 1).padStart(2, '0')}`,
      });
    }
  });

  const categories: Category[] = [
    { id: 'cat_1', name: 'Materials' },
    { id: 'cat_2', name: 'Labor' },
    { id: 'cat_3', name: 'Equipment' },
    { id: 'cat_4', name: 'Subcontractors' },
    { id: 'cat_5', name: 'Permits & Fees' },
    { id: 'cat_6', name: 'Other' },
  ];
  categories.forEach((c) => db.categories.set(c.id, c));

  const vendorSeeds: Vendor[] = [
    { id: 'vendor_1',  name: 'Concrete Supply Co.',    trade: 'Materials' },
    { id: 'vendor_2',  name: 'Rodriguez Framing LLC',  trade: 'Labor' },
    { id: 'vendor_3',  name: 'City of Springfield',    trade: 'Permits & Fees' },
    { id: 'vendor_4',  name: 'Pacific Electrical LLC', trade: 'Electrical' },
    { id: 'vendor_5',  name: 'Heavy Lift Rentals',     trade: 'Equipment' },
    { id: 'vendor_6',  name: 'MedTech HVAC Systems',   trade: 'HVAC' },
    { id: 'vendor_7',  name: 'CoreSteel Fabricators',  trade: 'Steel' },
    { id: 'vendor_8',  name: 'Atlas Equipment Rentals', trade: 'Equipment' },
    { id: 'vendor_9',  name: 'Western Lumber Co.',     trade: 'Materials' },
    { id: 'vendor_10', name: 'Summit Roofing Inc.',    trade: 'Labor' },
  ];
  vendorSeeds.forEach((v) => db.vendors.set(v.id, v));

  const expenseSeeds: Expense[] = [
    { id: 'exp_1',  projectId: 'proj_1', amount: 12480,  categoryId: 'cat_1', vendorId: 'vendor_1',  description: 'Foundation pour materials',       expenseDate: '2026-02-10' },
    { id: 'exp_2',  projectId: 'proj_1', amount: 3200,   categoryId: 'cat_2', vendorId: 'vendor_2',  description: 'Framing crew — week 1',           expenseDate: '2026-02-14' },
    { id: 'exp_3',  projectId: 'proj_1', amount: 875,    categoryId: 'cat_5', vendorId: 'vendor_3',  description: 'Building permit fee',             expenseDate: '2026-01-20' },
    { id: 'exp_4',  projectId: 'proj_2', amount: 48000,  categoryId: 'cat_4', vendorId: 'vendor_4',  description: 'Electrical rough-in, phase 1',    expenseDate: '2026-01-15', lineItemId: 'bli_4' },
    { id: 'exp_5',  projectId: 'proj_2', amount: 22750,  categoryId: 'cat_1', vendorId: 'vendor_9',  description: 'Lumber & framing materials',       expenseDate: '2026-01-28', lineItemId: 'bli_5' },
    { id: 'exp_6',  projectId: 'proj_2', amount: 9600,   categoryId: 'cat_3', vendorId: 'vendor_5',  description: 'Crane rental — 3 days',           expenseDate: '2026-02-03', lineItemId: 'bli_6' },
    { id: 'exp_7',  projectId: 'proj_4', amount: 15300,  categoryId: 'cat_1', vendorId: 'vendor_7',  description: 'Steel roofing panels',             expenseDate: '2025-10-10' },
    { id: 'exp_8',  projectId: 'proj_4', amount: 6700,   categoryId: 'cat_2', vendorId: 'vendor_10', description: 'Roofing crew labor',              expenseDate: '2025-10-18' },
    { id: 'exp_9',  projectId: 'proj_5', amount: 87500,  categoryId: 'cat_4', vendorId: 'vendor_6',  description: 'HVAC installation, floors 1–3',   expenseDate: '2026-02-20', lineItemId: 'bli_7' },
    { id: 'exp_10', projectId: 'proj_5', amount: 34200,  categoryId: 'cat_1', vendorId: 'vendor_9',  description: 'Medical-grade flooring, wing A',  expenseDate: '2026-02-25', lineItemId: 'bli_8' },
    { id: 'exp_11', projectId: 'proj_5', amount: 12000,  categoryId: 'cat_5', vendorId: 'vendor_3',  description: 'Health dept. inspection fee',     expenseDate: '2026-02-28' },
    { id: 'exp_12', projectId: 'proj_8', amount: 61000,  categoryId: 'cat_4', vendorId: 'vendor_7',  description: 'Structural steel fabrication',    expenseDate: '2026-01-22', lineItemId: 'bli_9' },
    { id: 'exp_13', projectId: 'proj_8', amount: 18400,  categoryId: 'cat_3', vendorId: 'vendor_8',  description: 'Excavator rental — 5 days',       expenseDate: '2026-01-30', lineItemId: 'bli_10' },
    { id: 'exp_14', projectId: 'proj_8', amount: 4950,   categoryId: 'cat_6', vendorId: 'vendor_1',  description: 'Site safety equipment',           expenseDate: '2026-02-08' },
    { id: 'exp_15', projectId: 'proj_7', amount: 29100,  categoryId: 'cat_1', vendorId: 'vendor_9',  description: 'Final interior finish materials', expenseDate: '2025-12-01' },
  ];
  expenseSeeds.forEach((e) => db.expenses.set(e.id, e));

  const lineItemSeeds: BudgetLineItem[] = [
    { id: 'bli_1',  projectId: 'proj_1', categoryId: 'cat_2', description: 'Framing labor — all floors',              budgetedAmount: 28000 },
    { id: 'bli_2',  projectId: 'proj_1', categoryId: 'cat_1', description: 'Concrete & foundation materials',          budgetedAmount: 45000 },
    { id: 'bli_3',  projectId: 'proj_1', categoryId: 'cat_5', description: 'Permits & inspection fees',                budgetedAmount: 8500 },
    { id: 'bli_4',  projectId: 'proj_2', categoryId: 'cat_4', description: 'Electrical rough-in (full scope)',         budgetedAmount: 120000 },
    { id: 'bli_5',  projectId: 'proj_2', categoryId: 'cat_1', description: 'Structural lumber package',                budgetedAmount: 95000 },
    { id: 'bli_6',  projectId: 'proj_2', categoryId: 'cat_3', description: 'Crane & heavy equipment',                  budgetedAmount: 35000 },
    { id: 'bli_7',  projectId: 'proj_5', categoryId: 'cat_4', description: 'HVAC systems — floors 1–5',                budgetedAmount: 380000 },
    { id: 'bli_8',  projectId: 'proj_5', categoryId: 'cat_1', description: 'Medical-grade flooring, all wings',        budgetedAmount: 210000 },
    { id: 'bli_9',  projectId: 'proj_8', categoryId: 'cat_4', description: 'Structural steel fabrication & erection',  budgetedAmount: 540000 },
    { id: 'bli_10', projectId: 'proj_8', categoryId: 'cat_3', description: 'Excavation & site equipment',              budgetedAmount: 72000 },
  ];
  lineItemSeeds.forEach((b) => db.budgetLineItems.set(b.id, b));

  const quoteSeeds: Quote[] = [
    { id: 'quote_1', lineItemId: 'bli_4', projectId: 'proj_2', vendorId: 'vendor_4', amount: 112000,  status: 'awarded',  submittedAt: '2025-12-01' },
    { id: 'quote_2', lineItemId: 'bli_4', projectId: 'proj_2', vendorId: 'vendor_1', amount: 118500,  status: 'rejected', submittedAt: '2025-12-03' },
    { id: 'quote_3', lineItemId: 'bli_7', projectId: 'proj_5', vendorId: 'vendor_6', amount: 365000,  status: 'awarded',  submittedAt: '2026-01-10' },
    { id: 'quote_4', lineItemId: 'bli_9', projectId: 'proj_8', vendorId: 'vendor_7', amount: 515000,  status: 'awarded',  submittedAt: '2025-12-15' },
    { id: 'quote_5', lineItemId: 'bli_9', projectId: 'proj_8', vendorId: 'vendor_8', amount: 530000,  status: 'rejected', submittedAt: '2025-12-16' },
  ];
  quoteSeeds.forEach((q) => db.quotes.set(q.id, q));
};
