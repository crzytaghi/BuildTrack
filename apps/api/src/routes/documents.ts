import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { PrismaClient } from '@prisma/client';
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2, BUCKET, MAX_FILE_SIZE } from '../lib/r2.js';
import { isManager, projectScope, type AuthUser } from '../lib/permissions.js';

type PluginOptions = {
  prisma: PrismaClient;
  requireAuth: (req: any, reply: any) => Promise<void>;
};

const DOCUMENT_TYPES = ['contract', 'permit', 'drawing', 'invoice', 'photo', 'report', 'other'] as const;

// Owners and managers see every company document. Field users only see documents
// attached to projects they are assigned to (not company-wide documents).
const documentScope = (user: AuthUser) =>
  isManager(user) ? { companyId: user.companyId } : { companyId: user.companyId, project: projectScope(user) };

const documentRoutes = async (app: FastifyInstance, { prisma, requireAuth }: PluginOptions) => {
  const authUser = (req: any): AuthUser => req.auth.user;

  // Field users must attach documents to one of their assigned projects.
  const canUploadTo = async (user: AuthUser, projectId: string | undefined) => {
    if (!projectId) return isManager(user);
    const project = await prisma.project.findFirst({ where: { id: projectId, ...projectScope(user) } });
    return !!project;
  };

  // Generate a presigned PUT URL for direct browser → R2 upload
  app.post('/documents/upload-url', { preHandler: requireAuth }, async (req, reply) => {
    const { companyId } = (req as any).auth.user;
    const body = z.object({
      fileName: z.string().min(1),
      mimeType: z.string().min(1),
      fileSize: z.number().int().positive().max(MAX_FILE_SIZE, 'File exceeds 50 MB limit'),
      projectId: z.string().optional(),
    }).parse(req.body);

    if (!(await canUploadTo(authUser(req), body.projectId))) {
      return reply.code(404).send({ error: 'Project not found' });
    }

    const safeFileName = body.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileKey = `${companyId}/${body.projectId ?? 'general'}/${Date.now()}-${safeFileName}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: fileKey,
      ContentType: body.mimeType,
      ContentLength: body.fileSize,
    });

    const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 900 }); // 15 min
    return reply.send({ uploadUrl, fileKey });
  });

  // Create document record after upload completes
  app.post('/documents', { preHandler: requireAuth }, async (req, reply) => {
    const { companyId } = (req as any).auth.user;
    const body = z.object({
      fileKey: z.string().min(1),
      title: z.string().min(1),
      type: z.enum(DOCUMENT_TYPES).default('other'),
      fileName: z.string().min(1),
      fileSize: z.number().int().positive(),
      mimeType: z.string().min(1),
      projectId: z.string().optional(),
      notes: z.string().optional(),
    }).parse(req.body);

    // Validate the project is one this user can access (required for field users)
    if (!(await canUploadTo(authUser(req), body.projectId))) {
      return reply.code(404).send({ error: 'Project not found' });
    }

    const doc = await prisma.document.create({
      data: {
        id: `doc_${Date.now()}`,
        companyId,
        projectId: body.projectId ?? null,
        title: body.title,
        type: body.type,
        fileKey: body.fileKey,
        fileName: body.fileName,
        fileSize: body.fileSize,
        mimeType: body.mimeType,
        notes: body.notes ?? null,
        createdAt: new Date().toISOString(),
      },
    });

    return reply.code(201).send({ data: doc });
  });

  // List documents for the company (optionally filtered by projectId or type)
  app.get('/documents', { preHandler: requireAuth }, async (req, reply) => {
    const query = z.object({
      projectId: z.string().optional(),
      type: z.string().optional(),
    }).parse(req.query);

    const docs = await prisma.document.findMany({
      where: {
        ...documentScope(authUser(req)),
        ...(query.projectId ? { projectId: query.projectId } : {}),
        ...(query.type ? { type: query.type } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ data: docs });
  });

  // Generate a presigned GET URL for download (1 hour expiry)
  app.get('/documents/:id/url', { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };

    const doc = await prisma.document.findFirst({ where: { id, ...documentScope(authUser(req)) } });
    if (!doc) return reply.code(404).send({ error: 'Document not found' });

    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: doc.fileKey,
      ResponseContentDisposition: `attachment; filename="${doc.fileName}"`,
    });

    const url = await getSignedUrl(r2, command, { expiresIn: 3600 });
    return reply.send({ url });
  });

  // Update document notes
  app.patch('/documents/:id', { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = z.object({
      notes: z.string().optional(),
    }).parse(req.body);

    const doc = await prisma.document.findFirst({ where: { id, ...documentScope(authUser(req)) } });
    if (!doc) return reply.code(404).send({ error: 'Document not found' });

    const updated = await prisma.document.update({
      where: { id },
      data: { notes: body.notes ?? null },
    });

    return reply.send({ data: updated });
  });

  // Delete document from R2 and DB
  app.delete('/documents/:id', { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };

    const doc = await prisma.document.findFirst({ where: { id, ...documentScope(authUser(req)) } });
    if (!doc) return reply.code(404).send({ error: 'Document not found' });

    await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: doc.fileKey }));
    await prisma.document.delete({ where: { id } });

    return reply.code(204).send();
  });
};

export default documentRoutes;
