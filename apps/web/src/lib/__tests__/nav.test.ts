import { describe, it, expect } from 'vitest';
import { isNavActive, navItemsFor } from '../nav';
import { canManage, isOwner } from '../permissions';

const labels = (role: Parameters<typeof navItemsFor>[0]) => navItemsFor(role).map((i) => i.label);

describe('navItemsFor', () => {
  it('gives owners and managers every section, including Team', () => {
    for (const role of ['owner', 'manager'] as const) {
      expect(labels(role)).toEqual([
        'Dashboard', 'Projects', 'Tasks', 'Expenses', 'Vendors', 'Invoices', 'Documents', 'Reports', 'Team', 'Settings',
      ]);
    }
  });

  it('hides invoices, reports and team from field users', () => {
    expect(labels('field')).toEqual(['Dashboard', 'Projects', 'Tasks', 'Expenses', 'Vendors', 'Documents', 'Settings']);
  });
});

describe('isNavActive', () => {
  it('matches the dashboard exactly and other sections by prefix', () => {
    const [dashboard, projects] = navItemsFor('owner');
    expect(isNavActive(dashboard, '/')).toBe(true);
    expect(isNavActive(dashboard, '/projects')).toBe(false);
    expect(isNavActive(projects, '/projects/proj_1')).toBe(true);
    expect(isNavActive(projects, '/projectsx')).toBe(false);
  });
});

describe('permissions', () => {
  it('canManage covers owners and managers only', () => {
    expect([canManage('owner'), canManage('manager'), canManage('field'), canManage(undefined)]).toEqual([true, true, false, false]);
  });

  it('isOwner covers owners only', () => {
    expect([isOwner('owner'), isOwner('manager'), isOwner('field')]).toEqual([true, false, false]);
  });
});
