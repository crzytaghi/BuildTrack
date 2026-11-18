import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InviteAcceptView from '../InviteAcceptView';

const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));

const invite = { email: 'fay@co.dev', role: 'field', companyName: 'Acme Builders' };
const accepted = { token: 'session', user: { id: 'u3', name: 'Fay', email: 'fay@co.dev', role: 'field' }, company: { name: 'Acme Builders' } };

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn((url: string, init?: RequestInit) =>
    init?.method === 'POST' ? json(accepted, 201) : json({ data: invite }),
  );
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const renderView = (props: Partial<Parameters<typeof InviteAcceptView>[0]> = {}) => {
  const onAccepted = vi.fn();
  const onLogout = vi.fn();
  render(<InviteAcceptView inviteToken="tok" signedInAs={null} onAccepted={onAccepted} onLogout={onLogout} {...props} />);
  return { onAccepted, onLogout };
};

describe('InviteAcceptView', () => {
  it('shows the company and role, and joins with a valid password', async () => {
    const { onAccepted } = renderView();
    expect(await screen.findByText('Join Acme Builders')).toBeInTheDocument();
    expect(screen.getByText('Field')).toBeInTheDocument();
    expect(screen.getByText('fay@co.dev')).toBeInTheDocument();

    const join = screen.getByRole('button', { name: /join team/i });
    await userEvent.type(screen.getByLabelText(/your name/i), 'Fay');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'weak');
    expect(join).toBeDisabled();

    await userEvent.clear(screen.getByLabelText(/^password$/i));
    await userEvent.type(screen.getByLabelText(/^password$/i), 'Strong1!pass');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'Strong1!pass');
    expect(join).toBeEnabled();
    await userEvent.click(join);

    expect(onAccepted).toHaveBeenCalledWith(accepted);
    const [url, init] = fetchMock.mock.calls.find(([, i]) => i?.method === 'POST')!;
    expect(url).toContain('/invites/token/tok/accept');
    expect(JSON.parse(init.body)).toEqual({ name: 'Fay', password: 'Strong1!pass' });
  });

  it('explains when the link is invalid or expired', async () => {
    fetchMock.mockImplementation(() => json({ error: 'nope' }, 404));
    renderView();
    expect(await screen.findByText(/isn't valid/i)).toBeInTheDocument();
  });

  it('asks a signed-in user to log out first', async () => {
    const { onLogout } = renderView({ signedInAs: { id: 'u1', name: 'Olive', email: 'olive@co.dev', role: 'owner' } });
    expect(await screen.findByText(/already signed in/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /log out/i }));
    expect(onLogout).toHaveBeenCalled();
  });

  it('shows the API error if accepting fails', async () => {
    fetchMock.mockImplementation((_url: string, init?: RequestInit) =>
      init?.method === 'POST' ? json({ error: 'A user with this email already exists' }, 409) : json({ data: invite }),
    );
    const { onAccepted } = renderView();
    await screen.findByText('Join Acme Builders');
    await userEvent.type(screen.getByLabelText(/your name/i), 'Fay');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'Strong1!pass');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'Strong1!pass');
    await userEvent.click(screen.getByRole('button', { name: /join team/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('already exists');
    expect(onAccepted).not.toHaveBeenCalled();
  });
});
