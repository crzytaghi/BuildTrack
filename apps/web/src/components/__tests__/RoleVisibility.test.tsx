import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '../Sidebar';
import ProjectsView from '../ProjectsView';
import VendorsView from '../VendorsView';
import { CurrentUserProvider } from '../../context/CurrentUserContext';
import type { Role } from '../../types/projects';

const userWith = (role: Role) => ({ id: 'u', name: 'U', email: 'u@co.dev', role });

describe('Sidebar', () => {
  it('hides manager-only sections from field users', () => {
    render(
      <MemoryRouter>
        <CurrentUserProvider value={userWith('field')}>
          <Sidebar onLogout={vi.fn()} />
        </CurrentUserProvider>
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Tasks' })).toBeInTheDocument();
    for (const name of ['Invoices', 'Reports', 'Team']) {
      expect(screen.queryByRole('link', { name })).not.toBeInTheDocument();
    }
  });

  it('shows the Team section to owners', () => {
    render(
      <MemoryRouter>
        <CurrentUserProvider value={userWith('owner')}>
          <Sidebar onLogout={vi.fn()} />
        </CurrentUserProvider>
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Team' })).toHaveAttribute('href', '/team');
  });
});

describe('ProjectsView', () => {
  const props = {
    projects: [], loading: false, error: null,
    form: { name: '', status: 'planning', startDate: '', endDate: '', budgetTotal: '', notes: '' },
    onFormChange: vi.fn(), onSubmit: vi.fn(), onViewProject: vi.fn(),
  } as unknown as Parameters<typeof ProjectsView>[0];

  it('shows the new project form only when the user can create projects', () => {
    const { rerender } = render(<ProjectsView {...props} canCreate />);
    expect(screen.getByText('New Project')).toBeInTheDocument();
    rerender(<ProjectsView {...props} canCreate={false} />);
    expect(screen.queryByText('New Project')).not.toBeInTheDocument();
  });
});

describe('VendorsView', () => {
  const vendor = { id: 'v1', name: 'Concrete Co', companyId: 'c' };
  const props = {
    vendors: [vendor], expenses: [], projects: [], loading: false, error: null,
    form: { name: '', trade: '', contactName: '', phone: '', email: '', notes: '' },
    editingVendorId: null, deletingVendorId: null, createOpen: false, submitAttempted: false,
    onFormChange: vi.fn(), onCreateVendor: vi.fn(), onSubmit: vi.fn(), onCancelEdit: vi.fn(),
    onEditVendor: vi.fn(), onRequestDeleteVendor: vi.fn(), onDeleteVendor: vi.fn(),
  } as unknown as Parameters<typeof VendorsView>[0];

  it('hides add, edit and delete from users who can only view vendors', () => {
    const { rerender } = render(<VendorsView {...props} canEdit />);
    expect(screen.getByRole('button', { name: 'Add Vendor' })).toBeInTheDocument();
    rerender(<VendorsView {...props} canEdit={false} />);
    expect(screen.getByText('Concrete Co')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add Vendor' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
  });
});
