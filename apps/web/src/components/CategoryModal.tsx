import { useState } from 'react';
import { getApiBase } from '../lib/api';
import type { Category } from '../types/projects';

const API_BASE = getApiBase();

type InUse = { expenseCount: number; lineItemCount: number };

type Props = {
  open: boolean;
  onClose: () => void;
  token: string;
  categories: Category[];
  onCategoriesChange: (cats: Category[]) => void;
};

const CategoryModal = ({ open, onClose, token, categories, onCategoriesChange }: Props) => {
  const [newName,      setNewName]      = useState('');
  const [saving,       setSaving]       = useState(false);
  const [addError,     setAddError]     = useState<string | null>(null);
  const [renamingId,   setRenamingId]   = useState<string | null>(null);
  const [renameValue,  setRenameValue]  = useState('');
  const [inUse,        setInUse]        = useState<Record<string, InUse>>({});

  if (!open) return null;

  const authHeader = { Authorization: `Bearer ${token}` };
  const sorted = [...categories].sort((a, b) => a.name.localeCompare(b.name));

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    setAddError(null);
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { ...authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    });
    setSaving(false);
    if (!res.ok) { setAddError('Unable to create category'); return; }
    const { data } = (await res.json()) as { data: Category };
    onCategoriesChange([...categories, data]);
    setNewName('');
  };

  const handleRename = async (id: string) => {
    if (!renameValue.trim()) { setRenamingId(null); return; }
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'PATCH',
      headers: { ...authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: renameValue.trim() }),
    });
    if (!res.ok) { setRenamingId(null); return; }
    const { data } = (await res.json()) as { data: Category };
    onCategoriesChange(categories.map((c) => (c.id === id ? data : c)));
    setRenamingId(null);
  };

  const handleDelete = async (id: string) => {
    setInUse((prev) => { const next = { ...prev }; delete next[id]; return next; });
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'DELETE',
      headers: authHeader,
    });
    if (res.status === 409) {
      const body = (await res.json()) as { expenseCount: number; lineItemCount: number };
      setInUse((prev) => ({ ...prev, [id]: { expenseCount: body.expenseCount, lineItemCount: body.lineItemCount } }));
      return;
    }
    if (res.ok) {
      onCategoriesChange(categories.filter((c) => c.id !== id));
    }
  };

  const inUseSummary = (usage: InUse) => {
    const parts: string[] = [];
    if (usage.expenseCount > 0) parts.push(`${usage.expenseCount} expense${usage.expenseCount !== 1 ? 's' : ''}`);
    if (usage.lineItemCount > 0) parts.push(`${usage.lineItemCount} budget line item${usage.lineItemCount !== 1 ? 's' : ''}`);
    return `Used by ${parts.join(' and ')}. Update those before deleting.`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-panel shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="text-sm font-semibold text-slate-200">Manage Categories</div>
          <button className="text-slate-400 hover:text-slate-200" onClick={onClose}>✕</button>
        </div>

        <div className="max-h-72 overflow-y-auto divide-y divide-slate-800">
          {sorted.length === 0 ? (
            <div className="px-6 py-6 text-sm text-slate-400">No categories yet. Add one below.</div>
          ) : (
            sorted.map((cat) => (
              <div key={cat.id} className="px-6 py-3">
                {renamingId === cat.id ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename(cat.id);
                      if (e.key === 'Escape') setRenamingId(null);
                    }}
                    onBlur={() => handleRename(cat.id)}
                    className="w-full rounded-xl bg-surface px-3 py-2 text-sm text-slate-100 outline-none ring-1 ring-slate-700 focus:ring-accent"
                  />
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm text-slate-100">{cat.name}</div>
                      {inUse[cat.id] && (
                        <div className="mt-1 text-xs text-amber-300">{inUseSummary(inUse[cat.id])}</div>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <button
                        className="text-xs text-slate-400 hover:text-slate-200"
                        onClick={() => { setRenamingId(cat.id); setRenameValue(cat.name); }}
                      >
                        Rename
                      </button>
                      <button
                        className="text-xs text-red-400 hover:text-red-300"
                        onClick={() => handleDelete(cat.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="border-t border-slate-800 px-6 py-4">
          {addError && (
            <div className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">{addError}</div>
          )}
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              placeholder="New category name"
              className="flex-1 rounded-xl bg-surface px-3 py-2 text-sm text-slate-100 outline-none ring-1 ring-slate-800 focus:ring-accent"
            />
            <button
              onClick={handleAdd}
              disabled={saving || !newName.trim()}
              className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryModal;
