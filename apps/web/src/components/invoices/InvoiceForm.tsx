import { useState } from 'react';
import type { InvoiceItem, InvoiceLineItemFormState, ProjectItem } from '../../types/projects';
import { getApiBase } from '../../lib/api';

const API_BASE = getApiBase();

type LineItemRow = InvoiceLineItemFormState;

const emptyLine = (): LineItemRow => ({ description: '', quantity: '1', unitPrice: '' });

export type InvoiceFormValues = {
  projectId: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  dueDate: string;
  notes: string;
  lineItems: LineItemRow[];
};

const emptyForm = (projectId = ''): InvoiceFormValues => ({
  projectId, clientName: '', clientEmail: '', clientAddress: '', dueDate: '', notes: '',
  lineItems: [emptyLine()],
});

const lineTotal = (li: LineItemRow) => {
  const q = Number(li.quantity);
  const u = Number(li.unitPrice);
  return Number.isFinite(q) && Number.isFinite(u) ? q * u : 0;
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

type Props = {
  token: string;
  projects: ProjectItem[];
  fixedProjectId?: string;
  editingInvoice?: InvoiceItem | null;
  onSaved: (inv: InvoiceItem) => void;
  onCancel: () => void;
};

const InvoiceForm = ({ token, projects, fixedProjectId, editingInvoice, onSaved, onCancel }: Props) => {
  const initial: InvoiceFormValues = editingInvoice
    ? {
        projectId: editingInvoice.projectId,
        clientName: editingInvoice.clientName,
        clientEmail: editingInvoice.clientEmail,
        clientAddress: editingInvoice.clientAddress ?? '',
        dueDate: editingInvoice.dueDate ?? '',
        notes: editingInvoice.notes ?? '',
        lineItems: editingInvoice.lineItems.map((li) => ({
          description: li.description,
          quantity: String(li.quantity),
          unitPrice: String(li.unitPrice),
        })),
      }
    : emptyForm(fixedProjectId ?? '');

  const [form, setForm] = useState<InvoiceFormValues>(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const setField = <K extends keyof InvoiceFormValues>(k: K, v: InvoiceFormValues[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const setLine = (i: number, field: keyof LineItemRow, value: string) =>
    setForm((p) => ({ ...p, lineItems: p.lineItems.map((li, idx) => idx === i ? { ...li, [field]: value } : li) }));

  const addLine = () => setForm((p) => ({ ...p, lineItems: [...p.lineItems, emptyLine()] }));
  const removeLine = (i: number) => setForm((p) => ({ ...p, lineItems: p.lineItems.filter((_, idx) => idx !== i) }));

  const subtotal = form.lineItems.reduce((s, li) => s + lineTotal(li), 0);

  const validate = () => {
    if (!form.projectId) return 'Project is required';
    if (!form.clientName.trim()) return 'Client name is required';
    if (!form.clientEmail.trim()) return 'Client email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.clientEmail.trim())) return 'Client email must be a valid email address';
    if (form.lineItems.some((li) => !li.description.trim() || Number(li.quantity) <= 0 || !li.unitPrice))
      return 'All line items must have a description, quantity greater than 0, and unit price';
    return null;
  };

  const handleSubmit = async () => {
    setAttempted(true);
    const err = validate();
    if (err) { setError(err); return; }
    setSaving(true);
    setError(null);
    const payload = {
      projectId: form.projectId,
      clientName: form.clientName.trim(),
      clientEmail: form.clientEmail.trim(),
      clientAddress: form.clientAddress.trim() || undefined,
      dueDate: form.dueDate || undefined,
      notes: form.notes.trim() || undefined,
      lineItems: form.lineItems.map((li) => ({
        description: li.description.trim(),
        quantity: Number(li.quantity),
        unitPrice: Number(li.unitPrice),
      })),
    };
    const url = editingInvoice ? `${API_BASE}/invoices/${editingInvoice.id}` : `${API_BASE}/invoices`;
    const res = await fetch(url, {
      method: editingInvoice ? 'PATCH' : 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({})) as { error?: string };
      setError(d.error ?? 'Unable to save invoice');
      setSaving(false);
      return;
    }
    const data = (await res.json()) as { data: InvoiceItem };
    onSaved(data.data);
  };

  const ring = (empty: boolean) => attempted && empty ? 'ring-red-500' : 'ring-slate-800 focus:ring-accent';

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="text-lg font-semibold text-slate-100">{editingInvoice ? 'Edit Invoice' : 'New Invoice'}</div>

      {error && <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {!fixedProjectId && (
          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-400 mb-1">Project *</label>
            <select
              value={form.projectId}
              onChange={(e) => setField('projectId', e.target.value)}
              className={`w-full rounded-xl bg-surface px-4 py-3 text-sm text-slate-100 outline-none ring-1 ${ring(!form.projectId)}`}
            >
              <option value="">Select project</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="block text-xs uppercase tracking-wide text-slate-400 mb-1">Due Date</label>
          <input
            type="date"
            value={form.dueDate}
            onChange={(e) => setField('dueDate', e.target.value)}
            className="w-full rounded-xl bg-surface px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-slate-800 focus:ring-accent"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wide text-slate-400 mb-1">Client Name *</label>
          <input
            value={form.clientName}
            onChange={(e) => setField('clientName', e.target.value)}
            placeholder="Acme Corp"
            className={`w-full rounded-xl bg-surface px-4 py-3 text-sm text-slate-100 outline-none ring-1 ${ring(!form.clientName.trim())}`}
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wide text-slate-400 mb-1">Client Email *</label>
          <input
            value={form.clientEmail}
            onChange={(e) => setField('clientEmail', e.target.value)}
            placeholder="client@example.com"
            className={`w-full rounded-xl bg-surface px-4 py-3 text-sm text-slate-100 outline-none ring-1 ${ring(!form.clientEmail.trim())}`}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs uppercase tracking-wide text-slate-400 mb-1">Client Address</label>
          <input
            value={form.clientAddress}
            onChange={(e) => setField('clientAddress', e.target.value)}
            placeholder="123 Main St, City, State 00000"
            className="w-full rounded-xl bg-surface px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-slate-800 focus:ring-accent"
          />
        </div>
      </div>

      {/* Line items */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <div className="text-xs uppercase tracking-wide text-slate-400">Line Items *</div>
          <button onClick={addLine} className="text-xs text-accent hover:underline">+ Add line</button>
        </div>
        <div className="overflow-x-auto rounded-xl bg-surface ring-1 ring-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-2 text-left">Description</th>
                <th className="px-4 py-2 text-right w-20">Qty</th>
                <th className="px-4 py-2 text-right w-28">Unit Price</th>
                <th className="px-4 py-2 text-right w-24">Total</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {form.lineItems.map((li, i) => (
                <tr key={i} className="border-b border-slate-800 last:border-0">
                  <td className="px-4 py-2">
                    <input
                      value={li.description}
                      onChange={(e) => setLine(i, 'description', e.target.value)}
                      placeholder="Description"
                      className="w-full bg-transparent text-slate-100 outline-none placeholder-slate-600"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      value={li.quantity}
                      onChange={(e) => setLine(i, 'quantity', e.target.value)}
                      type="number"
                      min="0"
                      className="w-full bg-transparent text-right text-slate-100 outline-none"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      value={li.unitPrice}
                      onChange={(e) => setLine(i, 'unitPrice', e.target.value)}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full bg-transparent text-right text-slate-100 outline-none"
                    />
                  </td>
                  <td className="px-4 py-2 text-right text-slate-300">{fmt(lineTotal(li))}</td>
                  <td className="px-2 py-2 text-center">
                    {form.lineItems.length > 1 && (
                      <button onClick={() => removeLine(i)} className="text-slate-600 hover:text-red-400 text-xs">✕</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-700">
                <td colSpan={3} className="px-4 py-2 text-right text-xs uppercase tracking-wide text-slate-400">Subtotal</td>
                <td className="px-4 py-2 text-right font-semibold text-slate-100">{fmt(subtotal)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wide text-slate-400 mb-1">Notes / Payment Terms</label>
        <textarea
          value={form.notes}
          onChange={(e) => setField('notes', e.target.value)}
          rows={3}
          placeholder="Payment due within 30 days..."
          className="w-full rounded-xl bg-surface px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-slate-800 focus:ring-accent resize-none"
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-50"
        >
          {saving ? 'Saving...' : editingInvoice ? 'Update Invoice' : 'Create Invoice'}
        </button>
        <button onClick={onCancel} className="text-sm text-slate-400 hover:text-slate-200">Cancel</button>
      </div>
    </div>
  );
};

export default InvoiceForm;
