import { useEffect, useState } from 'react';
import { getApiBase } from '../lib/api';

const API_BASE = getApiBase();

type Props = {
  token: string;
  userEmail: string;
};

const SettingsView = ({ token, userEmail }: Props) => {
  const [companyName, setCompanyName] = useState('');
  const [companyNameInput, setCompanyNameInput] = useState('');
  const [editingCompany, setEditingCompany] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/company/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data: { company: { name: string } | null }) => {
        const name = data.company?.name ?? '';
        setCompanyName(name);
        setCompanyNameInput(name);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleSaveCompany = async () => {
    if (!companyNameInput.trim()) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const res = await fetch(`${API_BASE}/company/me`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: companyNameInput.trim() }),
      });
      if (!res.ok) throw new Error('Unable to save');
      const data = (await res.json()) as { company: { name: string } };
      setCompanyName(data.company.name);
      setCompanyNameInput(data.company.name);
      setEditingCompany(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setSaveError('Unable to save company name.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <header className="flex flex-col gap-4 bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div>
          <div className="text-2xl font-semibold font-display">Settings</div>
          <div className="text-sm text-slate-400">Manage your account and company settings.</div>
        </div>
      </header>

      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">

        {/* Company settings */}
        <div className="rounded-2xl bg-panel p-6 shadow-lg">
          <div className="text-sm font-semibold text-slate-200">Company</div>
          {loading ? (
            <div className="mt-4 text-sm text-slate-400">Loading...</div>
          ) : (
            <div className="mt-4">
              {saveError && (
                <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{saveError}</div>
              )}
              {saveSuccess && (
                <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">Company name updated.</div>
              )}
              {!editingCompany ? (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-400">Company Name</div>
                    <div className="mt-1 text-sm text-slate-100">{companyName || '—'}</div>
                  </div>
                  <button
                    className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200"
                    onClick={() => { setEditingCompany(true); setSaveError(null); }}
                  >
                    Edit
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <input
                    value={companyNameInput}
                    onChange={(e) => setCompanyNameInput(e.target.value)}
                    placeholder="Company name"
                    className="flex-1 rounded-xl bg-surface px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-slate-800 focus:ring-accent"
                  />
                  <button
                    className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
                    onClick={handleSaveCompany}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    className="text-xs uppercase tracking-wide text-slate-400"
                    onClick={() => { setEditingCompany(false); setCompanyNameInput(companyName); setSaveError(null); }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Account info */}
        <div className="rounded-2xl bg-panel p-6 shadow-lg">
          <div className="text-sm font-semibold text-slate-200">Account</div>
          <div className="mt-4 space-y-3 text-sm">
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-400">Email</div>
              <div className="mt-1 text-slate-100">{userEmail}</div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
};

export default SettingsView;
