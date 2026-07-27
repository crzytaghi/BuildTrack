import { useEffect, useState } from 'react';
import type { InvoiceItem, InvoiceStatus, ProjectItem } from '../types/projects';
import { getApiBase } from '../lib/api';
import InvoiceForm from './invoices/InvoiceForm';
import InvoiceSendModal from './invoices/InvoiceSendModal';

const API_BASE = getApiBase();

const STATUS_BADGE: Record<InvoiceStatus, string> = {
  draft:   'bg-slate-700 text-slate-300',
  sent:    'bg-sky-900 text-sky-300',
  paid:    'bg-emerald-900/50 text-emerald-300',
  overdue: 'bg-red-900/50 text-red-300',
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

type Props = {
  token: string;
  companyName: string;
  projects: ProjectItem[];
};

const InvoicesView = ({ token, companyName, projects }: Props) => {
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceItem | null>(null);
  const [sendingInvoice, setSendingInvoice] = useState<InvoiceItem | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/invoices`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d: { data: InvoiceItem[] }) => setInvoices(d.data))
      .catch(() => setError('Failed to load invoices'))
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = invoices
    .filter((inv) => !filterStatus || inv.status === filterStatus)
    .filter((inv) => !filterProject || inv.projectId === filterProject);

  const handleSaved = (inv: InvoiceItem) => {
    setInvoices((prev) =>
      editingInvoice ? prev.map((i) => (i.id === inv.id ? inv : i)) : [inv, ...prev]
    );
    setShowForm(false);
    setEditingInvoice(null);
  };

  const handleSent = (inv: InvoiceItem) => {
    setInvoices((prev) => prev.map((i) => (i.id === inv.id ? inv : i)));
    setSendingInvoice(null);
  };

  const handleMarkPaid = async (id: string) => {
    const res = await fetch(`${API_BASE}/invoices/${id}/mark-paid`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = (await res.json()) as { data: InvoiceItem };
      setInvoices((prev) => prev.map((i) => (i.id === id ? data.data : i)));
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`${API_BASE}/invoices/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setInvoices((prev) => prev.filter((i) => i.id !== id));
      setDeletingId(null);
    }
  };

  const handleDownloadPdf = (inv: InvoiceItem) => {
    fetch(`${API_BASE}/invoices/${inv.id}/pdf`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${inv.invoiceNumber}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      });
  };

  if (showForm || editingInvoice) {
    return (
      <InvoiceForm
        token={token}
        projects={projects}
        editingInvoice={editingInvoice}
        onSaved={handleSaved}
        onCancel={() => { setShowForm(false); setEditingInvoice(null); }}
      />
    );
  }

  return (
    <>
      <header className="flex flex-col gap-4 bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div>
          <div className="text-2xl font-semibold font-display">Invoices</div>
          <div className="text-sm text-slate-400">Create and manage client invoices.</div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-slate-950 shadow"
        >
          + New Invoice
        </button>
      </header>

      <div className="px-4 py-4 sm:px-6 lg:px-8 space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl bg-panel px-4 py-2 text-sm text-slate-200 ring-1 ring-slate-800 outline-none"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="rounded-xl bg-panel px-4 py-2 text-sm text-slate-200 ring-1 ring-slate-800 outline-none"
          >
            <option value="">All Projects</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {(filterStatus || filterProject) && (
            <button onClick={() => { setFilterStatus(''); setFilterProject(''); }} className="text-xs text-slate-400 hover:text-slate-200">
              Clear
            </button>
          )}
        </div>

        {error && <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>}
        {loading && <div className="text-sm text-slate-400">Loading...</div>}
        {!loading && filtered.length === 0 && (
          <div className="text-sm text-slate-400">No invoices found.</div>
        )}

        {/* Invoice list */}
        <div className="space-y-3">
          {filtered.map((inv) => {
            const subtotal = inv.lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0);
            return (
              <div key={inv.id} className="rounded-2xl bg-panel p-4 shadow">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-100">{inv.invoiceNumber}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[inv.status]}`}>
                        {inv.status}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-slate-400">{inv.clientName} · {inv.project?.name ?? ''}</div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {inv.dueDate ? `Due ${inv.dueDate}` : 'No due date'} · {inv.lineItems.length} line item{inv.lineItems.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-100">{fmt(subtotal)}</div>
                    {inv.paidAt && <div className="text-xs text-emerald-400 mt-0.5">Paid {inv.paidAt.slice(0, 10)}</div>}
                    {inv.sentAt && !inv.paidAt && <div className="text-xs text-slate-500 mt-0.5">Sent {inv.sentAt.slice(0, 10)}</div>}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-800 pt-3">
                  <button
                    onClick={() => handleDownloadPdf(inv)}
                    className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:text-white"
                  >
                    ↓ PDF
                  </button>
                  {inv.status === 'draft' && (
                    <>
                      <button
                        onClick={() => setSendingInvoice(inv)}
                        className="rounded-full border border-sky-800 px-3 py-1 text-xs text-sky-300 hover:text-sky-100"
                      >
                        Send
                      </button>
                      <button
                        onClick={() => setEditingInvoice(inv)}
                        className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:text-white"
                      >
                        Edit
                      </button>
                      {deletingId === inv.id ? (
                        <>
                          <span className="text-xs text-slate-400">Delete?</span>
                          <button onClick={() => handleDelete(inv.id)} className="text-xs text-red-400 hover:text-red-300">Yes</button>
                          <button onClick={() => setDeletingId(null)} className="text-xs text-slate-400 hover:text-slate-200">No</button>
                        </>
                      ) : (
                        <button onClick={() => setDeletingId(inv.id)} className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400 hover:text-red-400">
                          Delete
                        </button>
                      )}
                    </>
                  )}
                  {(inv.status === 'sent' || inv.status === 'overdue') && (
                    <button
                      onClick={() => handleMarkPaid(inv.id)}
                      className="rounded-full border border-emerald-800 px-3 py-1 text-xs text-emerald-300 hover:text-emerald-100"
                    >
                      Mark Paid
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {sendingInvoice && (
        <InvoiceSendModal
          invoice={sendingInvoice}
          companyName={companyName}
          token={token}
          onSent={handleSent}
          onClose={() => setSendingInvoice(null)}
        />
      )}
    </>
  );
};

export default InvoicesView;
