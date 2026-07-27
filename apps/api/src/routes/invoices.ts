import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { PrismaClient } from '@prisma/client';
import { generateInvoicePdf } from '../lib/pdf.js';

type InvoicePluginOptions = {
  prisma: PrismaClient;
  requireAuth: (req: any, reply: any) => Promise<void>;
};

const lineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
});

const today = () => new Date().toISOString().slice(0, 10);

const nextInvoiceNumber = async (prisma: PrismaClient, companyId: string): Promise<string> => {
  const count = await prisma.invoice.count({ where: { companyId } });
  return `INV-${String(count + 1).padStart(4, '0')}`;
};

// Lazily mark overdue invoices in the DB and return updated records
const resolveOverdue = async (prisma: PrismaClient, companyId: string) => {
  const t = today();
  await prisma.invoice.updateMany({
    where: { companyId, status: 'sent', dueDate: { lt: t, not: null } },
    data: { status: 'overdue', updatedAt: new Date().toISOString() },
  });
};

const invoiceRoutes = async (app: FastifyInstance, options: InvoicePluginOptions) => {
  const { prisma, requireAuth } = options;

  // ── List all invoices for company ─────────────────────────────────────────
  app.get('/invoices', { preHandler: requireAuth }, async (req) => {
    const { companyId } = (req as any).auth.user;
    await resolveOverdue(prisma, companyId);
    const invoices = await prisma.invoice.findMany({
      where: { companyId },
      include: { lineItems: true, project: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return { data: invoices };
  });

  // ── List invoices for a project ───────────────────────────────────────────
  app.get('/projects/:projectId/invoices', { preHandler: requireAuth }, async (req, reply) => {
    const { companyId } = (req as any).auth.user;
    const { projectId } = req.params as { projectId: string };
    await resolveOverdue(prisma, companyId);
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.companyId !== companyId) return reply.code(404).send({ error: 'Not found' });
    const invoices = await prisma.invoice.findMany({
      where: { projectId, companyId },
      include: { lineItems: true },
      orderBy: { createdAt: 'desc' },
    });
    return { data: invoices };
  });

  // ── Get single invoice ────────────────────────────────────────────────────
  app.get('/invoices/:id', { preHandler: requireAuth }, async (req, reply) => {
    const { companyId } = (req as any).auth.user;
    const { id } = req.params as { id: string };
    const invoice = await prisma.invoice.findUnique({ where: { id }, include: { lineItems: true, project: { select: { id: true, name: true } } } });
    if (!invoice || invoice.companyId !== companyId) return reply.code(404).send({ error: 'Not found' });
    return { data: invoice };
  });

  // ── Create invoice ────────────────────────────────────────────────────────
  app.post('/invoices', { preHandler: requireAuth }, async (req, reply) => {
    const { companyId } = (req as any).auth.user;
    const body = z.object({
      projectId: z.string().min(1),
      clientName: z.string().min(1),
      clientEmail: z.string().email(),
      clientAddress: z.string().optional(),
      dueDate: z.string().optional(),
      notes: z.string().optional(),
      lineItems: z.array(lineItemSchema).min(1),
    }).parse(req.body);

    const project = await prisma.project.findUnique({ where: { id: body.projectId } });
    if (!project || project.companyId !== companyId) return reply.code(404).send({ error: 'Project not found' });

    const invoiceNumber = await nextInvoiceNumber(prisma, companyId);
    const now = new Date().toISOString();
    const id = `inv_${Date.now()}`;

    const invoice = await prisma.invoice.create({
      data: {
        id,
        companyId,
        projectId: body.projectId,
        invoiceNumber,
        status: 'draft',
        clientName: body.clientName,
        clientEmail: body.clientEmail,
        clientAddress: body.clientAddress,
        dueDate: body.dueDate,
        notes: body.notes,
        createdAt: now,
        updatedAt: now,
        lineItems: {
          create: body.lineItems.map((li, i) => ({
            id: `invli_${Date.now()}_${i}`,
            description: li.description,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
          })),
        },
      },
      include: { lineItems: true },
    });

    return reply.code(201).send({ data: invoice });
  });

  // ── Update invoice (DRAFT only) ───────────────────────────────────────────
  app.patch('/invoices/:id', { preHandler: requireAuth }, async (req, reply) => {
    const { companyId } = (req as any).auth.user;
    const { id } = req.params as { id: string };
    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (!existing || existing.companyId !== companyId) return reply.code(404).send({ error: 'Not found' });
    if (existing.status !== 'draft') return reply.code(409).send({ error: 'Only draft invoices can be edited' });

    const body = z.object({
      clientName: z.string().min(1).optional(),
      clientEmail: z.string().email().optional(),
      clientAddress: z.string().optional(),
      dueDate: z.string().optional(),
      notes: z.string().optional(),
      lineItems: z.array(lineItemSchema).min(1).optional(),
    }).parse(req.body);

    const { lineItems, ...fields } = body;
    const now = new Date().toISOString();

    if (lineItems) {
      await prisma.invoiceLineItem.deleteMany({ where: { invoiceId: id } });
      await prisma.invoiceLineItem.createMany({
        data: lineItems.map((li, i) => ({
          id: `invli_${Date.now()}_${i}`,
          invoiceId: id,
          description: li.description,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
        })),
      });
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: { ...fields, updatedAt: now },
      include: { lineItems: true },
    });
    return { data: updated };
  });

  // ── Delete invoice (DRAFT only) ───────────────────────────────────────────
  app.delete('/invoices/:id', { preHandler: requireAuth }, async (req, reply) => {
    const { companyId } = (req as any).auth.user;
    const { id } = req.params as { id: string };
    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (!existing || existing.companyId !== companyId) return reply.code(404).send({ error: 'Not found' });
    if (existing.status !== 'draft') return reply.code(409).send({ error: 'Only draft invoices can be deleted' });
    await prisma.invoice.delete({ where: { id } });
    return reply.code(204).send();
  });

  // ── Mark as Sent ──────────────────────────────────────────────────────────
  app.post('/invoices/:id/send', { preHandler: requireAuth }, async (req, reply) => {
    const { companyId } = (req as any).auth.user;
    const { id } = req.params as { id: string };
    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (!existing || existing.companyId !== companyId) return reply.code(404).send({ error: 'Not found' });
    if (existing.status !== 'draft') return reply.code(409).send({ error: 'Invoice is not a draft' });
    const now = new Date().toISOString();
    const updated = await prisma.invoice.update({
      where: { id },
      data: { status: 'sent', sentAt: now, updatedAt: now },
      include: { lineItems: true },
    });
    return { data: updated };
  });

  // ── Mark as Paid ──────────────────────────────────────────────────────────
  app.post('/invoices/:id/mark-paid', { preHandler: requireAuth }, async (req, reply) => {
    const { companyId } = (req as any).auth.user;
    const { id } = req.params as { id: string };
    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (!existing || existing.companyId !== companyId) return reply.code(404).send({ error: 'Not found' });
    if (existing.status === 'draft') return reply.code(409).send({ error: 'Cannot mark a draft as paid' });
    const now = new Date().toISOString();
    const updated = await prisma.invoice.update({
      where: { id },
      data: { status: 'paid', paidAt: now, updatedAt: now },
      include: { lineItems: true },
    });
    return { data: updated };
  });

  // ── Generate PDF ──────────────────────────────────────────────────────────
  app.get('/invoices/:id/pdf', { preHandler: requireAuth }, async (req, reply) => {
    const { companyId } = (req as any).auth.user;
    const { id } = req.params as { id: string };
    const invoice = await prisma.invoice.findUnique({ where: { id }, include: { lineItems: true } });
    if (!invoice || invoice.companyId !== companyId) return reply.code(404).send({ error: 'Not found' });
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) return reply.code(404).send({ error: 'Company not found' });

    const pdf = await generateInvoicePdf({
      invoiceNumber: invoice.invoiceNumber,
      createdAt: invoice.createdAt,
      dueDate: invoice.dueDate,
      notes: invoice.notes,
      company: { name: company.name, address: company.address, phone: company.phone },
      client: { name: invoice.clientName, email: invoice.clientEmail, address: invoice.clientAddress },
      lineItems: invoice.lineItems.map((li) => ({
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
      })),
    });

    reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`)
      .send(pdf);
  });
};

export default invoiceRoutes;
