export const ROLES = ['owner', 'manager', 'field'] as const;
export type Role = (typeof ROLES)[number];

/** Roles that may be granted through an invite. Owners are only created at signup or by promotion. */
export const INVITABLE_ROLES = ['manager', 'field'] as const;

/** Owners and managers: full access to every project and to financials. */
export const MANAGERS: Role[] = ['owner', 'manager'];
export const OWNERS: Role[] = ['owner'];

export type AuthUser = { id: string; companyId: string; role: string };

export const isManager = (user: AuthUser) => user.role === 'owner' || user.role === 'manager';

/**
 * Prisma `where` filter for the projects a user may see.
 * Owners and managers see every project in their company; field users only see
 * projects they are assigned to. Use it directly on Project queries, or nested as
 * `{ project: projectScope(user) }` on project-owned records.
 */
export const projectScope = (user: AuthUser) =>
  isManager(user)
    ? { companyId: user.companyId }
    : { companyId: user.companyId, members: { some: { userId: user.id } } };
