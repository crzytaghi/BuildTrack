import { useEffect, useState } from 'react';
import { getApiBase } from '../../lib/api';
import type { ProjectItem } from '../../types/projects';

const API_BASE = getApiBase();

type Props = {
  project:                ProjectItem;
  onProjectUpdate:        (updated: ProjectItem) => void;
  deletingProjectId:      string | null;
  onRequestDeleteProject: (id: string | null) => void;
  onDeleteProject:        (id: string) => void;
  token:                  string;
};

const SettingsTab = ({ project, onProjectUpdate, deletingProjectId, onRequestDeleteProject, onDeleteProject, token }: Props) => {
  const [form, setForm] = useState({
    name:        project.name,
    status:      project.status,
    startDate:   project.startDate ?? '',
    endDate:     project.endDate ?? '',
    budgetTotal: project.budgetTotal?.toString() ?? '',
    notes:       project.notes ?? '',
  });
  const [saving,       setSaving]       = useState(false);
  const [editError,    setEditError]    = useState<string | null>(null);
  const [editSuccess,  setEditSuccess]  = useState(false);

  // Sync form if project prop changes (e.g. on re-navigate)
  useEffect(() => {
    setForm({
      name:        project.name,
      status:      project.status,
      startDate:   project.startDate ?? '',
      endDate:     project.endDate ?? '',
      budgetTotal: project.budgetTotal?.toString() ?? '',
      notes:       project.notes ?? '',
    });
  }, [project.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    if (!form.name.trim()) { setEditError('Project name is required'); return; }
    setSaving(true);
    setEditError(null);
    try {
      const res = await fetch(`${API_BASE}/projects/${project.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:        form.name.trim(),
          status:      form.status,
          startDate:   form.startDate   || undefined,
          endDate:     form.endDate     || undefined,
          budgetTotal: form.budgetTotal ? Number(form.budgetTotal) : undefined,
          notes:       form.notes       || undefined,
        }),
      });
      if (!res.ok) throw new Error('Unable to save project');
      const data = (await res.json()) as { data: ProjectItem };
      onProjectUpdate(data.data);
      setEditSuccess(true);
      setTimeout(() => setEditSuccess(false), 3000);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Unable to save project');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">

      {/* Project details form */}
      <div className="rounded-2xl bg-panel p-6 shadow-lg">
        <div className="text-sm font-semibold text-slate-200">Project Details</div>
        {editError && (
          <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{editError}</div>
        )}
        {editSuccess && (
          <div className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">Project saved.</div>
        )}
        <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div className="col-span-2">
            <label className="text-xs uppercase tracking-wide text-slate-400">Project Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="mt-2 w-full rounded-xl bg-surface px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-slate-800 focus:ring-accent"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-400">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as ProjectItem['status'] }))}
              className="mt-2 w-full rounded-xl bg-surface px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-slate-800 focus:ring-accent"
            >
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-400">Budget Total</label>
            <input
              type="number"
              value={form.budgetTotal}
              onChange={(e) => setForm((prev) => ({ ...prev, budgetTotal: e.target.value }))}
              className="mt-2 w-full rounded-xl bg-surface px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-slate-800 focus:ring-accent"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-400">Start Date</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
              className="mt-2 w-full rounded-xl bg-surface px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-slate-800 focus:ring-accent"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-400">End Date</label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
              className="mt-2 w-full rounded-xl bg-surface px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-slate-800 focus:ring-accent"
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs uppercase tracking-wide text-slate-400">Notes</label>
            <input
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              className="mt-2 w-full rounded-xl bg-surface px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-slate-800 focus:ring-accent"
            />
          </div>
        </div>
        <button
          className="mt-5 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl border border-red-900/50 bg-panel p-6 shadow-lg">
        <div className="text-sm font-semibold text-red-400">Danger Zone</div>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-200">Delete this project</div>
            <div className="text-xs text-slate-400">Permanently removes the project and all associated tasks, expenses, and budget data.</div>
          </div>
          <div className="ml-6 shrink-0">
            {deletingProjectId === project.id ? (
              <div className="flex items-center gap-2">
                <button
                  className="rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs text-red-300"
                  onClick={() => onDeleteProject(project.id)}
                >
                  Confirm delete
                </button>
                <button className="text-xs text-slate-400" onClick={() => onRequestDeleteProject(null)}>
                  Cancel
                </button>
              </div>
            ) : (
              <button
                className="rounded-full border border-red-900 px-4 py-2 text-xs font-medium text-red-400 hover:bg-red-900/20"
                onClick={() => onRequestDeleteProject(project.id)}
              >
                Delete Project
              </button>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default SettingsTab;
