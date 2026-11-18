import type { Role } from '../types/projects';

// Mirrors apps/api/src/lib/permissions.ts. The API enforces these rules; the
// web app uses them only to hide screens and actions a user can't use.

export const ROLE_LABELS: Record<Role, string> = {
  owner: 'Owner',
  manager: 'Manager',
  field: 'Field',
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  owner: 'Everything, including team and company settings',
  manager: 'All projects, budgets, invoices and reports',
  field: 'Tasks, documents and expenses on assigned projects',
};

/** Owners and managers: every project, budgets, invoices, reports, vendor/category edits. */
export const canManage = (role: Role | undefined) => role === 'owner' || role === 'manager';

/** Owners only: team invites, role changes, removing members, company settings. */
export const isOwner = (role: Role | undefined) => role === 'owner';
