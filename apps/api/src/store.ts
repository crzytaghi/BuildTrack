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

  db.expenses.set('exp_1', {
    id: 'exp_1',
    projectId: 'proj_1',
    amount: 12480,
    categoryId: 'cat_1',
    description: 'Concrete Supply Co.',
    expenseDate: '2026-02-10',
  });
};
