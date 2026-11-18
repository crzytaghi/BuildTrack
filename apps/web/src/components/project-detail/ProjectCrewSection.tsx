import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiBase } from '../../lib/api';
import type { Member } from '../../types/projects';

const API_BASE = getApiBase();

type Props = { projectId: string; token: string };

/** Owners and managers assign field users to a project. Field users only see assigned projects. */
const ProjectCrewSection = ({ projectId, token }: Props) => {
  const [crew, setCrew] = useState<Member[]>([]);
  const [fieldMembers, setFieldMembers] = useState<Member[]>([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    (async () => {
      try {
        const [crewRes, membersRes] = await Promise.all([
          fetch(`${API_BASE}/projects/${projectId}/members`, { headers }),
          fetch(`${API_BASE}/members`, { headers }),
        ]);
        if (!crewRes.ok || !membersRes.ok) throw new Error('Unable to load crew');
        setCrew(((await crewRes.json()) as { data: Member[] }).data);
        const members = ((await membersRes.json()) as { data: Member[] }).data;
        setFieldMembers(members.filter((m) => m.role === 'field'));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load crew');
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId, token]);

  const available = fieldMembers.filter((m) => !crew.some((c) => c.id === m.id));

  const handleAdd = async () => {
    if (!selected) return;
    setError(null);
    const res = await fetch(`${API_BASE}/projects/${projectId}/members`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: selected }),
    });
    if (!res.ok) { setError('Unable to add crew member'); return; }
    const { data } = (await res.json()) as { data: Member };
    setCrew((prev) => [...prev, data]);
    setSelected('');
  };

  const handleRemove = async (userId: string) => {
    setError(null);
    const res = await fetch(`${API_BASE}/projects/${projectId}/members/${userId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok && res.status !== 404) { setError('Unable to remove crew member'); return; }
    setCrew((prev) => prev.filter((c) => c.id !== userId));
  };

  return (
    <div className="rounded-2xl bg-panel p-6 shadow-lg">
      <div className="text-sm font-semibold text-slate-200">Crew</div>
      <div className="mt-1 text-xs text-slate-400">
        Field users only see the projects they're assigned to. Owners and managers see every project.
      </div>
      {error && (
        <div role="alert" className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>
      )}
      {loading ? (
        <div className="mt-4 text-sm text-slate-400">Loading...</div>
      ) : (
        <>
          {crew.length === 0 ? (
            <div className="mt-4 text-sm text-slate-500">No field users assigned yet.</div>
          ) : (
            <ul className="mt-4 divide-y divide-slate-800">
              {crew.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-2">
                  <div>
                    <div className="text-sm text-slate-100">{c.name}</div>
                    <div className="text-xs text-slate-400">{c.email}</div>
                  </div>
                  <button className="text-xs text-slate-400 hover:text-red-300" onClick={() => handleRemove(c.id)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          {fieldMembers.length === 0 ? (
            <div className="mt-4 text-xs text-slate-500">
              No field users in your company yet. <Link to="/team" className="text-accent">Invite one from Team</Link>.
            </div>
          ) : available.length > 0 && (
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <select
                aria-label="Add crew member"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="w-full rounded-xl bg-surface px-4 py-3 text-sm text-slate-100 ring-1 ring-slate-800"
              >
                <option value="">Choose a field user…</option>
                {available.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                ))}
              </select>
              <button
                className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
                disabled={!selected}
                onClick={handleAdd}
              >
                Assign
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProjectCrewSection;
