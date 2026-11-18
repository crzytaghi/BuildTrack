import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TeamView from '../TeamView';
import { CurrentUserProvider } from '../../context/CurrentUserContext';
import type { Member, Role, User } from '../../types/projects';

const members: Member[] = [
  { id: 'u1', name: 'Olive Owner', email: 'olive@co.dev', role: 'owner', createdAt: '2026-01-01' },
  { id: 'u2', name: 'Max Manager', email: 'max@co.dev', role: 'manager', createdAt: '2026-01-02' },
  { id: 'u3', name: 'Fay Field', email: 'fay@co.dev', role: 'field', createdAt: '2026-01-03' },
];

const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));

const renderAs = (me: Member) => {
  const user: User = { id: me.id, name: me.name, email: me.email, role: me.role as Role };
  return render(
    <CurrentUserProvider value={user}>
      <TeamView token="t" />
    </CurrentUserProvider>,
  );
};

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn((url: string, init?: RequestInit) => {
    if (url.endsWith('/members') && !init?.method) return json({ data: members });
    if (url.endsWith('/invites') && !init?.method) return json({ data: [] });
    if (url.endsWith('/invites') && init?.method === 'POST') {
      return json({ data: { id: 'inv_1', email: 'new@co.dev', role: 'field', createdAt: '', expiresAt: '2026-12-01T00:00:00Z' }, token: 'abc123' }, 201);
    }
    return json({ error: 'unexpected' }, 500);
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('TeamView', () => {
  it('lets owners create an invite link to share', async () => {
    renderAs(members[0]);
    await screen.findByText('Max Manager');

    await userEvent.type(screen.getByLabelText('Invite email'), 'new@co.dev');
    await userEvent.click(screen.getByRole('button', { name: /create invite link/i }));

    const link = await screen.findByLabelText('Invite link');
    expect(link).toHaveValue(`${window.location.origin}/invite/abc123`);
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST');
    expect(JSON.parse(post![1].body)).toEqual({ email: 'new@co.dev', role: 'field' });
    expect(screen.getByText('Pending invites')).toBeInTheDocument();
  });

  it('lets owners change roles and remove others, but not remove themselves', async () => {
    renderAs(members[0]);
    await screen.findByText('Max Manager');
    expect(screen.getByLabelText('Role for Max Manager')).toHaveValue('manager');
    expect(screen.getAllByRole('button', { name: 'Remove' })).toHaveLength(2);
  });

  it('shows managers a read-only list without invites', async () => {
    renderAs(members[1]);
    await screen.findByText('Fay Field');
    expect(screen.queryByLabelText('Invite email')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Role for Fay Field')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/invites'))).toBe(false);
  });

  it('shows the API error when an invite fails', async () => {
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === 'POST') return json({ error: 'A user with this email already exists' }, 409);
      if (url.endsWith('/members')) return json({ data: members });
      return json({ data: [] });
    });
    renderAs(members[0]);
    await screen.findByText('Max Manager');
    await userEvent.type(screen.getByLabelText('Invite email'), 'max@co.dev');
    await userEvent.click(screen.getByRole('button', { name: /create invite link/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('already exists'));
  });
});
