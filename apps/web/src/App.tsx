import { useEffect, useState } from 'react';

type User = { id: string; email: string; name: string };

type AuthResponse = { token: string; user: User };

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

const nav = [
  'Dashboard',
  'Projects',
  'Tasks',
  'Budget',
  'Expenses',
  'Documents',
  'Reports',
  'Settings',
];

const kpis = [
  { label: 'Total Budget', value: '$1.42M', tone: 'bg-emerald-400' },
  { label: 'Actual Spend', value: '$620k', tone: 'bg-amber-400' },
  { label: 'Variance', value: '$800k', tone: 'bg-sky-400' },
  { label: 'Active Projects', value: '4', tone: 'bg-violet-400' },
];

const getStoredToken = () => localStorage.getItem('bt_token');

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [authLoading, setAuthLoading] = useState(true);
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  useEffect(() => {
    const init = async () => {
      const currentToken = getStoredToken();
      if (!currentToken) {
        setAuthLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${currentToken}` },
        });
        if (!res.ok) throw new Error('Session expired');
        const data = (await res.json()) as { user: User };
        setUser(data.user);
        setToken(currentToken);
      } catch {
        localStorage.removeItem('bt_token');
        setToken(null);
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };
    init();
  }, []);

  const handleAuth = async (path: 'login' | 'signup', payload: Record<string, string>) => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) throw new Error('Invalid credentials');
        if (res.status === 409) throw new Error('Email already in use');
        throw new Error(data.error ?? 'Authentication failed');
      }
      const data = (await res.json()) as AuthResponse;
      localStorage.setItem('bt_token', data.token);
      setToken(data.token);
      setUser(data.user);
    } catch (err) {
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        throw new Error('Unable to reach the API. Is it running on port 4000?');
      }
      throw err;
    }
  };

  const handleLogout = async () => {
    if (token) {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null);
    }
    localStorage.removeItem('bt_token');
    setUser(null);
    setToken(null);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink text-slate-200">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-ink text-slate-100">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,#1e293b,transparent_55%)]" />
        <div className="mx-auto flex min-h-screen w-full max-w-lg items-center justify-center px-6">
          <div className="w-full rounded-2xl bg-panel p-8 shadow-xl">
            <div className="text-2xl font-semibold font-display">BuildTrack</div>
            <div className="mt-1 text-sm text-slate-400">
              Sign in to manage projects, budgets, and expenses.
            </div>
            <div className="mt-6 flex gap-2 rounded-full bg-slate-900 p-1 text-sm">
              <button
                className={`flex-1 rounded-full px-4 py-2 ${
                  authView === 'login' ? 'bg-accent text-slate-950' : 'text-slate-300'
                }`}
                onClick={() => {
                  setAuthView('login');
                  setError(null);
                  setSignupName('');
                  setSignupEmail('');
                  setSignupPassword('');
                }}
              >
                Login
              </button>
              <button
                className={`flex-1 rounded-full px-4 py-2 ${
                  authView === 'signup' ? 'bg-accent text-slate-950' : 'text-slate-300'
                }`}
                onClick={() => {
                  setAuthView('signup');
                  setError(null);
                  setLoginEmail('');
                  setLoginPassword('');
                }}
              >
                Sign Up
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </div>
            )}

            {authView === 'login' ? (
              <form
                className="mt-6 space-y-4"
                onSubmit={async (event) => {
                  event.preventDefault();
                  const form = event.currentTarget as HTMLFormElement;
                  try {
                    await handleAuth('login', { email: loginEmail, password: loginPassword });
                    setLoginEmail('');
                    setLoginPassword('');
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Login failed');
                  }
                }}
              >
                <div>
                  <label className="text-xs uppercase tracking-wide text-slate-400">Email</label>
                  <input
                    name="email"
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(event) => setLoginEmail(event.target.value)}
                    className="mt-2 w-full rounded-xl bg-surface px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-slate-800 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-slate-400">Password</label>
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    value={loginPassword}
                    onChange={(event) => setLoginPassword(event.target.value)}
                    className="mt-2 w-full rounded-xl bg-surface px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-slate-800 focus:ring-accent"
                  />
                </div>
                <button
                  className="mt-2 w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-slate-950"
                  type="submit"
                >
                  Login
                </button>
              </form>
            ) : (
              <form
                className="mt-6 space-y-4"
                onSubmit={async (event) => {
                  event.preventDefault();
                  const form = event.currentTarget as HTMLFormElement;
                  try {
                    await handleAuth('signup', {
                      name: signupName,
                      email: signupEmail,
                      password: signupPassword,
                    });
                    setSignupName('');
                    setSignupEmail('');
                    setSignupPassword('');
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Signup failed');
                  }
                }}
              >
                <div>
                  <label className="text-xs uppercase tracking-wide text-slate-400">Name</label>
                  <input
                    name="name"
                    type="text"
                    required
                    value={signupName}
                    onChange={(event) => setSignupName(event.target.value)}
                    className="mt-2 w-full rounded-xl bg-surface px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-slate-800 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-slate-400">Email</label>
                  <input
                    name="email"
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(event) => setSignupEmail(event.target.value)}
                    className="mt-2 w-full rounded-xl bg-surface px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-slate-800 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-slate-400">Password</label>
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    value={signupPassword}
                    onChange={(event) => setSignupPassword(event.target.value)}
                    className="mt-2 w-full rounded-xl bg-surface px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-slate-800 focus:ring-accent"
                  />
                </div>
                <button
                  className="mt-2 w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-slate-950"
                  type="submit"
                >
                  Create Account
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink text-slate-100">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,#1e293b,transparent_55%)]" />
      <div className="grid grid-cols-[260px_1fr]">
        <aside className="h-screen border-r border-slate-800 bg-[#0b1118] p-6">
          <div className="text-xl font-semibold tracking-tight font-display">BuildTrack</div>
          <div className="mt-10 space-y-2 text-sm">
            {nav.map((item) => (
              <div
                key={item}
                className={`rounded-lg px-3 py-2 ${
                  item === 'Dashboard' ? 'bg-slate-800 text-white' : 'text-slate-400'
                }`}
              >
                {item}
              </div>
            ))}
          </div>
        </aside>
        <main className="min-h-screen">
          <header className="flex items-center justify-between bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-6">
            <div>
              <div className="text-2xl font-semibold font-display">Dashboard</div>
              <div className="text-sm text-slate-400">Welcome back, {user.name}.</div>
            </div>
            <div className="flex items-center gap-3">
              <button className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-slate-950 shadow">
                Export CSV
              </button>
              <button
                className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200"
                onClick={handleLogout}
              >
                Log out
              </button>
            </div>
          </header>
          <section className="grid grid-cols-4 gap-6 px-8 py-6">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="rounded-2xl bg-surface p-5 shadow-lg">
                <div className="text-xs uppercase tracking-wide text-slate-400">{kpi.label}</div>
                <div className="mt-3 text-2xl font-semibold">{kpi.value}</div>
                <div className={`mt-4 h-2 w-16 rounded-full ${kpi.tone}`} />
              </div>
            ))}
          </section>
          <section className="grid grid-cols-[2fr_1fr] gap-6 px-8">
            <div className="rounded-2xl bg-panel p-6 shadow-lg">
              <div className="text-sm font-semibold text-slate-200">Budget vs Actual</div>
              <div className="mt-4 flex h-48 items-end gap-6">
                {[120, 140, 160, 130, 170].map((_, i) => (
                  <div key={i} className="flex items-end gap-2">
                    <div className="h-40 w-5 rounded-md bg-slate-700" />
                    <div className="h-32 w-5 rounded-md bg-sky-400" />
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-panel p-6 shadow-lg">
              <div className="text-sm font-semibold text-slate-200">Tasks Due Soon</div>
              <div className="mt-4 space-y-3">
                {['Foundation pour', 'Framing begins', 'Roofing delivery', 'Window install'].map((t) => (
                  <div key={t} className="rounded-lg bg-surface px-3 py-2 text-sm">
                    <div className="font-medium text-slate-100">{t}</div>
                    <div className="text-xs text-slate-400">Due Feb 14</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
          <section className="px-8 py-6">
            <div className="rounded-2xl bg-panel p-6 shadow-lg">
              <div className="text-sm font-semibold text-slate-200">Recent Expenses</div>
              <div className="mt-4 divide-y divide-slate-800 text-sm">
                {[
                  ['Concrete Supply Co.', 'Slab / Formwork', 'Maple St', '-$12,480'],
                  ['Riverstone Lumber', 'Framing', 'Maple St', '-$8,220'],
                  ['Peak Electrical', 'Rough-in', 'Maple St', '-$6,540'],
                ].map((row) => (
                  <div key={row[0]} className="grid grid-cols-[2fr_2fr_1fr_1fr] py-3 text-slate-300">
                    <div className="font-medium text-slate-100">{row[0]}</div>
                    <div className="text-slate-400">{row[1]}</div>
                    <div className="text-slate-400">{row[2]}</div>
                    <div className="text-amber-400">{row[3]}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
