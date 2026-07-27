import PDFDocument from 'pdfkit';

type LineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
};

type InvoiceData = {
  invoiceNumber: string;
  createdAt: string;
  dueDate?: string | null;
  notes?: string | null;
  company: { name: string; address?: string | null; phone?: string | null };
  client: { name: string; email: string; address?: string | null };
  lineItems: LineItem[];
};

const COLORS = {
  dark: '#0f172a',
  accent: '#0ea5e9',
  muted: '#64748b',
  border: '#e2e8f0',
  light: '#f8fafc',
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

export const generateInvoicePdf = (data: InvoiceData): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width - 100; // content width (margins 50 each side)

    // ── Header ──────────────────────────────────────────────────────────────
    doc.fontSize(22).fillColor(COLORS.dark).font('Helvetica-Bold').text(data.company.name, 50, 50);
    let companyY = 76;
    doc.fontSize(9).fillColor(COLORS.muted).font('Helvetica');
    if (data.company.address) {
      doc.text(data.company.address, 50, companyY);
      companyY += 14;
    }
    if (data.company.phone) {
      doc.text(data.company.phone, 50, companyY);
      companyY += 14;
    }

    // Invoice label (right-aligned)
    doc.fontSize(28).fillColor(COLORS.accent).font('Helvetica-Bold').text('INVOICE', 0, 50, { align: 'right' });
    doc.fontSize(10).fillColor(COLORS.muted).font('Helvetica').text(data.invoiceNumber, 0, 84, { align: 'right' });

    // ── Divider ──────────────────────────────────────────────────────────────
    const dividerY = Math.max(companyY, 96) + 16;
    doc.moveTo(50, dividerY).lineTo(50 + pageWidth, dividerY).strokeColor(COLORS.border).lineWidth(1).stroke();

    // ── Invoice meta + Bill To ───────────────────────────────────────────────
    const metaY = dividerY + 20;
    const rightCol = 350;

    doc.fontSize(8).fillColor(COLORS.muted).font('Helvetica-Bold').text('BILL TO', 50, metaY);
    doc.fontSize(10).fillColor(COLORS.dark).font('Helvetica-Bold').text(data.client.name, 50, metaY + 14);
    doc.fontSize(9).fillColor(COLORS.muted).font('Helvetica').text(data.client.email, 50, metaY + 28);
    let clientY = metaY + 42;
    if (data.client.address) {
      doc.text(data.client.address, 50, clientY);
      clientY += 14;
    }

    doc.fontSize(8).fillColor(COLORS.muted).font('Helvetica-Bold').text('ISSUE DATE', rightCol, metaY);
    doc.fontSize(9).fillColor(COLORS.dark).font('Helvetica').text(data.createdAt.slice(0, 10), rightCol, metaY + 14);

    if (data.dueDate) {
      doc.fontSize(8).fillColor(COLORS.muted).font('Helvetica-Bold').text('DUE DATE', rightCol, metaY + 32);
      doc.fontSize(9).fillColor(COLORS.dark).font('Helvetica').text(data.dueDate, rightCol, metaY + 46);
    }

    // ── Line items table ─────────────────────────────────────────────────────
    const tableY = Math.max(clientY, data.dueDate ? metaY + 66 : metaY + 30) + 24;

    // Table header background
    doc.rect(50, tableY, pageWidth, 22).fill(COLORS.dark);
    doc.fontSize(8).fillColor('#ffffff').font('Helvetica-Bold');
    doc.text('DESCRIPTION', 60, tableY + 7);
    doc.text('QTY', 360, tableY + 7, { width: 50, align: 'right' });
    doc.text('UNIT PRICE', 418, tableY + 7, { width: 70, align: 'right' });
    doc.text('TOTAL', 50 + pageWidth - 70, tableY + 7, { width: 70, align: 'right' });

    // Rows
    let rowY = tableY + 22;
    let subtotal = 0;
    data.lineItems.forEach((item, i) => {
      const total = item.quantity * item.unitPrice;
      subtotal += total;
      const bg = i % 2 === 0 ? '#ffffff' : COLORS.light;
      doc.rect(50, rowY, pageWidth, 24).fill(bg);
      doc.fontSize(9).fillColor(COLORS.dark).font('Helvetica');
      doc.text(item.description, 60, rowY + 7, { width: 280, ellipsis: true });
      doc.text(String(item.quantity), 360, rowY + 7, { width: 50, align: 'right' });
      doc.text(formatCurrency(item.unitPrice), 418, rowY + 7, { width: 70, align: 'right' });
      doc.text(formatCurrency(total), 50 + pageWidth - 70, rowY + 7, { width: 70, align: 'right' });
      rowY += 24;
    });

    // Subtotal row
    doc.moveTo(50, rowY).lineTo(50 + pageWidth, rowY).strokeColor(COLORS.border).lineWidth(1).stroke();
    rowY += 10;
    doc.fontSize(10).fillColor(COLORS.dark).font('Helvetica-Bold');
    doc.text('Subtotal', 0, rowY, { align: 'right', width: doc.page.width - 50 - 70 - 10 });
    doc.text(formatCurrency(subtotal), 50 + pageWidth - 70, rowY, { width: 70, align: 'right' });

    // ── Notes ────────────────────────────────────────────────────────────────
    if (data.notes) {
      rowY += 40;
      doc.moveTo(50, rowY).lineTo(50 + pageWidth, rowY).strokeColor(COLORS.border).lineWidth(1).stroke();
      rowY += 12;
      doc.fontSize(8).fillColor(COLORS.muted).font('Helvetica-Bold').text('NOTES / TERMS', 50, rowY);
      rowY += 14;
      doc.fontSize(9).fillColor(COLORS.dark).font('Helvetica').text(data.notes, 50, rowY, { width: pageWidth });
    }

    doc.end();
  });
};
