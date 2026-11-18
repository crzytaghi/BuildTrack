import { canManage } from './permissions';
import type { Role } from '../types/projects';

export type NavItem = { label: string; path: string };

const ALL: (NavItem & { managersOnly?: boolean })[] = [
  { label: 'Dashboard', path: '/' },
  { label: 'Projects', path: '/projects' },
  { label: 'Tasks', path: '/tasks' },
  { label: 'Expenses', path: '/expenses' },
  { label: 'Vendors', path: '/vendors' },
  { label: 'Invoices', path: '/invoices', managersOnly: true },
  { label: 'Documents', path: '/documents' },
  { label: 'Reports', path: '/reports', managersOnly: true },
  { label: 'Team', path: '/team', managersOnly: true },
  { label: 'Settings', path: '/settings' },
];

/** Navigation entries the given role can open. */
export const navItemsFor = (role: Role | undefined): NavItem[] =>
  ALL.filter((item) => !item.managersOnly || canManage(role)).map(({ label, path }) => ({ label, path }));

export const isNavActive = (item: NavItem, pathname: string) =>
  item.path === '/' ? pathname === '/' : pathname === item.path || pathname.startsWith(`${item.path}/`);
