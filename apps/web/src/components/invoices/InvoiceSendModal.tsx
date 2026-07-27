import { useState } from 'react';
import type { InvoiceItem } from '../../types/projects';
import { getApiBase } from '../../lib/api';

const API_BASE = getApiBase();

type Props = {
  invoice: InvoiceItem;
  companyName: string;
  token: string;
  onSent: (inv: InvoiceItem) => void;
  onClose: () => void;
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const InvoiceSendModal = ({ invoice, companyName, token, onSent, onClose }: Props) => {
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = invoice.lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0);

  const subject = encodeURIComponent(`Invoice ${invoice.invoiceNumber} from ${companyName}`);
  const body = encodeURIComponent(
    `Hi ${invoice.clientName},\n\nPlease find attached ${invoice.invoiceNumber} for ${fmt(subtotal)}${invoice.dueDate ? `, due by ${invoice.dueDate}` : ''}.\n\n${invoice.notes ? `${invoice.notes}\n\n` : ''}Thank you,\n${companyName}`
  );
  const mailtoHref = `mailto:${invoice.clientEmail}?subject=${subject}&body=${body}`;

  const handleDownloadPdf = () => {
    const a = document.createElement('a');
    a.href = `${API_BASE}/invoices/${invoice.id}/pdf`;
    a.setAttribute('Authorization', `Bearer ${token}`);
    // Use fetch to add auth header, then create object URL
    fetch(`${API_BASE}/invoices/${invoice.id}/pdf`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${invoice.invoiceNumber}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
      });
  };

  const handleMarkSent = async () => {
    setMarking(true);
    setError(null);
    const res = await fetch(`${API_BASE}/invoices/${invoice.id}/send`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) { setError('Unable to mark as sent'); setMarking(false); return; }
    const data = (await res.json()) as { data: InvoiceItem };
    onSent(data.data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-panel p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-base font-semibold text-slate-100">Send {invoice.invoiceNumber}</div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-lg leading-none">✕</button>
        </div>

        {error && <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>}

        <div className="space-y-4">
          <div className="rounded-xl bg-surface p-4 text-sm text-slate-300 space-y-1">
            <div><span className="text-slate-500">To:</span> {invoice.clientEmail}</div>
            <div><span className="text-slate-500">Amount:</span> {fmt(subtotal)}</div>
            {invoice.dueDate && <div><span className="text-slate-500">Due:</span> {invoice.dueDate}</div>}
          </div>

          <p className="text-sm text-slate-400">
            Download the PDF and send it via your email client. Once sent, mark the invoice as sent to update its status.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleDownloadPdf}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm text-slate-200 hover:border-slate-500"
            >
              ↓ Download PDF
            </button>
            <a
              href={mailtoHref}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm text-slate-200 hover:border-slate-500 text-center"
            >
              ✉ Open in Mail App
            </a>
            <button
              onClick={handleMarkSent}
              disabled={marking}
              className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-50"
            >
              {marking ? 'Saving...' : '✓ Mark as Sent'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceSendModal;
