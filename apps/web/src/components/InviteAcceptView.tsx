import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { getApiBase } from '../lib/api';
import { PASSWORD_RULES } from '../lib/passwordRules';
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from '../lib/permissions';
import type { Role, User } from '../types/projects';

const API_BASE = getApiBase();

type InviteInfo = { email: string; role: Role; companyName: string };
type AcceptResult = { token: string; user: User; company: { name: string } };

type Props = {
  inviteToken: string;
  /** Set when someone is already signed in on this browser. */
  signedInAs: User | null;
  onAccepted: (result: AcceptResult) => void;
  onLogout: () => void;
};

const field = 'mt-2 w-full rounded-xl bg-surface px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-slate-800 focus:ring-accent';

const InviteAcceptView = ({ inviteToken, signedInAs, onAccepted, onLogout }: Props) => {
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'invalid'>('loading');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/invites/token/${encodeURIComponent(inviteToken)}`)
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) { setStatus('invalid'); return; }
        setInvite(((await res.json()) as { data: InviteInfo }).data);
        setStatus('ready');
      })
      .catch(() => { if (!cancelled) setStatus('invalid'); });
    return () => { cancelled = true; };
  }, [inviteToken]);

  const passwordValid = PASSWORD_RULES.every((r) => r.test(password));
  const passwordsMatch = password.length > 0 && password === confirm;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/invites/token/${encodeURIComponent(inviteToken)}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? 'Unable to accept invite');
      }
      onAccepted((await res.json()) as AcceptResult);
    } catch (err) {
      setError(err instanceof TypeError ? 'Unable to reach the server. Please try again.' : (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const card = (children: ReactNode) => (
    <div className="min-h-screen bg-ink text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-lg items-center justify-center px-6">
        <div className="w-full rounded-3xl bg-panel p-8 shadow-2xl">
          <div className="text-2xl font-semibold font-display">BuildTrack</div>
          {children}
        </div>
      </div>
    </div>
  );

  if (status === 'loading') return card(<div className="mt-6 text-sm text-slate-400">Checking your invite…</div>);

  if (status === 'invalid' || !invite) {
    return card(
      <>
        <div className="mt-6 text-lg font-semibold">This invite link isn't valid</div>
        <div className="mt-2 text-sm text-slate-400">
          It may have expired, been used already, or been revoked. Ask the person who invited you for a new link.
        </div>
        <a href="/" className="mt-6 inline-block text-sm text-accent">Go to sign in</a>
      </>,
    );
  }

  if (signedInAs) {
    return card(
      <>
        <div className="mt-6 text-lg font-semibold">You're already signed in</div>
        <div className="mt-2 text-sm text-slate-400">
          You're signed in as {signedInAs.email}. This invite is for {invite.email}. Log out to accept it.
        </div>
        <div className="mt-6 flex gap-3">
          <button className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-slate-950" onClick={onLogout}>
            Log out
          </button>
          <a href="/" className="rounded-full border border-slate-700 px-5 py-2 text-sm text-slate-200">Back to app</a>
        </div>
      </>,
    );
  }

  return card(
    <>
      <div className="mt-6 text-lg font-semibold">Join {invite.companyName}</div>
      <div className="mt-1 text-sm text-slate-400">
        You've been invited as <span className="text-slate-200">{ROLE_LABELS[invite.role]}</span>: {ROLE_DESCRIPTIONS[invite.role].toLowerCase()}.
      </div>
      {error && (
        <div role="alert" className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>
      )}
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="text-xs uppercase tracking-wide text-slate-400">Email</label>
          <div className="mt-2 rounded-xl bg-surface px-4 py-3 text-sm text-slate-300">{invite.email}</div>
        </div>
        <div>
          <label htmlFor="invite-name" className="text-xs uppercase tracking-wide text-slate-400">Your name</label>
          <input id="invite-name" required value={name} onChange={(e) => setName(e.target.value)} className={field} />
        </div>
        <div>
          <label htmlFor="invite-password" className="text-xs uppercase tracking-wide text-slate-400">Password</label>
          <input id="invite-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
          {password.length > 0 && (
            <ul className="mt-2 space-y-1">
              {PASSWORD_RULES.map((rule) => (
                <li key={rule.label} className={`flex items-center gap-1.5 text-xs ${rule.test(password) ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <span>{rule.test(password) ? '✓' : '○'}</span>
                  {rule.label}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <label htmlFor="invite-confirm" className="text-xs uppercase tracking-wide text-slate-400">Confirm password</label>
          <input id="invite-confirm" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className={field} />
          {confirm.length > 0 && !passwordsMatch && <p className="mt-1.5 text-xs text-red-400">Passwords do not match</p>}
        </div>
        <button
          type="submit"
          className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
          disabled={!name.trim() || !passwordValid || !passwordsMatch || submitting}
        >
          {submitting ? 'Joining…' : 'Join team'}
        </button>
      </form>
    </>,
  );
};

export default InviteAcceptView;
