import { useCallback, useEffect, useState } from 'react';
import { getApiBase } from '../lib/api';
import { ROLE_DESCRIPTIONS, ROLE_LABELS, isOwner } from '../lib/permissions';
import { useCurrentUser } from '../context/CurrentUserContext';
import type { Member, PendingInvite, Role } from '../types/projects';

const API_BASE = getApiBase();

type Props = { token: string };

const inviteLink = (token: string) => `${window.location.origin}/invite/${token}`;

const field = 'w-full rounded-xl bg-surface px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-slate-800 focus:ring-accent';

const TeamView = ({ token }: Props) => {
  const me = useCurrentUser();
  const owner = isOwner(me?.role);
  const headers = { Authorization: `Bearer ${token}` };

  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Exclude<Role, 'owner'>>('field');
  const [inviting, setInviting] = useState(false);
  const [newLink, setNewLink] = useState<{ email: string; url: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [membersRes, invitesRes] = await Promise.all([
        fetch(`${API_BASE}/members`, { headers }),
        owner ? fetch(`${API_BASE}/invites`, { headers }) : Promise.resolve(null),
      ]);
      if (!membersRes.ok) throw new Error('Unable to load team');
      setMembers(((await membersRes.json()) as { data: Member[] }).data);
      if (invitesRes?.ok) setInvites(((await invitesRes.json()) as { data: PendingInvite[] }).data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load team');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, owner]);

  useEffect(() => { load(); }, [load]);

  const errorFrom = async (res: Response, fallback: string) =>
    ((await res.json().catch(() => ({}))) as { error?: string }).error ?? fallback;

  const handleInvite = async () => {
    setError(null);
    setInviting(true);
    try {
      const res = await fetch(`${API_BASE}/invites`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      if (!res.ok) throw new Error(await errorFrom(res, 'Unable to create invite'));
      const body = (await res.json()) as { data: PendingInvite; token: string };
      setNewLink({ email: body.data.email, url: inviteLink(body.token) });
      setCopied(false);
      setInviteEmail('');
      setInvites((prev) => [body.data, ...prev.filter((i) => i.email !== body.data.email)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create invite');
    } finally {
      setInviting(false);
    }
  };

  const handleCopy = async () => {
    if (!newLink) return;
    try {
      await navigator.clipboard.writeText(newLink.url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const handleRevoke = async (id: string) => {
    const res = await fetch(`${API_BASE}/invites/${id}`, { method: 'DELETE', headers });
    if (res.ok || res.status === 404) setInvites((prev) => prev.filter((i) => i.id !== id));
  };

  const handleRoleChange = async (member: Member, role: Role) => {
    setError(null);
    const res = await fetch(`${API_BASE}/members/${member.id}`, {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) { setError(await errorFrom(res, 'Unable to change role')); return; }
    const { data } = (await res.json()) as { data: Member };
    setMembers((prev) => prev.map((m) => (m.id === data.id ? data : m)));
  };

  const handleRemove = async (id: string) => {
    setError(null);
    const res = await fetch(`${API_BASE}/members/${id}`, { method: 'DELETE', headers });
    setRemovingId(null);
    if (!res.ok) { setError(await errorFrom(res, 'Unable to remove member')); return; }
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <>
      <header className="flex flex-col gap-4 bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div>
          <div className="text-2xl font-semibold font-display">Team</div>
          <div className="text-sm text-slate-400">
            {owner ? 'Invite people and choose what they can do.' : 'People in your company.'}
          </div>
        </div>
      </header>

      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {error && (
          <div role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>
        )}

        {owner && (
          <div className="rounded-2xl bg-panel p-6 shadow-lg">
            <div className="text-sm font-semibold text-slate-200">Invite someone</div>
            <div className="mt-1 text-xs text-slate-400">
              You'll get a link to send them. It works once and expires in 7 days.
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px_auto]">
              <input
                type="email"
                aria-label="Invite email"
                placeholder="name@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className={field}
              />
              <select
                aria-label="Invite role"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as Exclude<Role, 'owner'>)}
                className={field}
              >
                <option value="field">{ROLE_LABELS.field}</option>
                <option value="manager">{ROLE_LABELS.manager}</option>
              </select>
              <button
                className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
                disabled={!inviteEmail.includes('@') || inviting}
                onClick={handleInvite}
              >
                {inviting ? 'Creating…' : 'Create invite link'}
              </button>
            </div>
            <div className="mt-2 text-xs text-slate-500">{ROLE_DESCRIPTIONS[inviteRole]}</div>

            {newLink && (
              <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4">
                <div className="text-sm text-emerald-200">Invite link for {newLink.email}. Send it to them directly.</div>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input readOnly aria-label="Invite link" value={newLink.url} className={`${field} font-mono text-xs`} onFocus={(e) => e.target.select()} />
                  <button className="rounded-xl border border-slate-600 px-4 py-2 text-sm text-slate-100" onClick={handleCopy}>
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="mt-2 text-xs text-slate-400">This link won't be shown again. Create a new one if it's lost.</div>
              </div>
            )}
          </div>
        )}

        <div className="rounded-2xl bg-panel p-6 shadow-lg">
          <div className="text-sm font-semibold text-slate-200">Members</div>
          {loading ? (
            <div className="mt-4 text-sm text-slate-400">Loading...</div>
          ) : (
            <ul className="mt-4 divide-y divide-slate-800">
              {members.map((m) => (
                <li key={m.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm text-slate-100">{m.name}{m.id === me?.id && <span className="text-slate-500"> (you)</span>}</div>
                    <div className="text-xs text-slate-400">{m.email}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    {owner ? (
                      <select
                        aria-label={`Role for ${m.name}`}
                        value={m.role}
                        onChange={(e) => handleRoleChange(m, e.target.value as Role)}
                        className="rounded-lg bg-surface px-3 py-2 text-xs text-slate-100 ring-1 ring-slate-800"
                      >
                        {(['owner', 'manager', 'field'] as Role[]).map((r) => (
                          <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">{ROLE_LABELS[m.role]}</span>
                    )}
                    {owner && m.id !== me?.id && (
                      removingId === m.id ? (
                        <span className="flex gap-2">
                          <button className="text-xs text-red-300" onClick={() => handleRemove(m.id)}>Confirm</button>
                          <button className="text-xs text-slate-400" onClick={() => setRemovingId(null)}>Cancel</button>
                        </span>
                      ) : (
                        <button className="text-xs text-red-400 hover:text-red-300" onClick={() => setRemovingId(m.id)}>
                          Remove
                        </button>
                      )
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {owner && invites.length > 0 && (
          <div className="rounded-2xl bg-panel p-6 shadow-lg">
            <div className="text-sm font-semibold text-slate-200">Pending invites</div>
            <ul className="mt-4 divide-y divide-slate-800">
              {invites.map((i) => (
                <li key={i.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-sm text-slate-100">{i.email}</div>
                    <div className="text-xs text-slate-400">
                      {ROLE_LABELS[i.role]} · expires {new Date(i.expiresAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button className="text-xs text-slate-400 hover:text-red-300" onClick={() => handleRevoke(i.id)}>
                    Revoke
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
};

export default TeamView;
