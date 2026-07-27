import { useEffect, useState } from 'react';
import { getApiBase } from '../lib/api';

const API_BASE = getApiBase();

type CompanyData = { name: string; address: string | null; phone: string | null };

type Props = {
  token: string;
  userEmail: string;
};

const SettingsView = ({ token, userEmail }: Props) => {
  const [company, setCompany] = useState<CompanyData>({ name: '', address: null, phone: null });
  const [form, setForm] = useState({ name: '', address: '', phone: '' });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/company/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data: { company: CompanyData | null }) => {
        const c = data.company ?? { name: '', address: null, phone: null };
        setCompany(c);
        setForm({ name: c.name, address: c.address ?? '', phone: c.phone ?? '' });
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const res = await fetch(`${API_BASE}/company/me`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          address: form.address.trim() || null,
          phone: form.phone.trim() || null,
        }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { company: CompanyData };
      setCompany(data.company);
      setForm({ name: data.company.name, address: data.company.address ?? '', phone: data.company.phone ?? '' });
      setEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setSaveError('Unable to save company settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setForm({ name: company.name, address: company.address ?? '', phone: company.phone ?? '' });
    setSaveError(null);
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
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-200">Company</div>
            {!editing && !loading && (
              <button
                className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200"
                onClick={() => { setEditing(true); setSaveError(null); }}
              >
                Edit
              </button>
            )}
          </div>

          {loading ? (
            <div className="mt-4 text-sm text-slate-400">Loading...</div>
          ) : (
            <div className="mt-4">
              {saveError && (
                <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{saveError}</div>
              )}
              {saveSuccess && (
                <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">Company settings updated.</div>
              )}

              {!editing ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-400">Company Name</div>
                    <div className="mt-1 text-sm text-slate-100">{company.name || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-400">Address</div>
                    <div className="mt-1 text-sm text-slate-100">{company.address || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-400">Phone</div>
                    <div className="mt-1 text-sm text-slate-100">{company.phone || '—'}</div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-slate-400 mb-1">Company Name *</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Company name"
                      className="w-full rounded-xl bg-surface px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-slate-800 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-slate-400 mb-1">Address</label>
                    <input
                      value={form.address}
                      onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                      placeholder="123 Main St, City, State 00000"
                      className="w-full rounded-xl bg-surface px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-slate-800 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-slate-400 mb-1">Phone</label>
                    <input
                      value={form.phone}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="(555) 555-5555"
                      className="w-full rounded-xl bg-surface px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-slate-800 focus:ring-accent"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button className="text-xs uppercase tracking-wide text-slate-400" onClick={handleCancel}>
                      Cancel
                    </button>
                  </div>
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
