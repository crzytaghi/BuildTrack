import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { PrismaClient } from '@prisma/client';

type CompanyPluginOptions = {
  prisma: PrismaClient;
  requireAuth: (req: any, reply: any, done: any) => void;
};

const companyRoutes = async (app: FastifyInstance, options: CompanyPluginOptions) => {
  const { prisma, requireAuth } = options;

  app.get('/company/me', { preHandler: requireAuth }, async (req) => {
    const { companyId } = (req as any).auth.user;
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) return { company: null };
    return {
      company: {
        id: company.id,
        name: company.name,
        companySetupComplete: company.companySetupComplete,
      },
    };
  });

  app.patch('/company/me', { preHandler: requireAuth }, async (req, reply) => {
    const { companyId } = (req as any).auth.user;
    const body = z.object({ name: z.string().min(1) }).parse(req.body);
    const updated = await prisma.company.update({ where: { id: companyId }, data: { name: body.name } });
    return reply.send({ company: { id: updated.id, name: updated.name, companySetupComplete: updated.companySetupComplete } });
  });

  app.post('/company/setup', { preHandler: requireAuth }, async (req, reply) => {
    const body = z
      .object({
        name: z.string().min(1),
      })
      .parse(req.body);

    const { companyId } = (req as any).auth.user;
    const updated = await prisma.company.update({
      where: { id: companyId },
      data: { name: body.name, companySetupComplete: true },
    });

    return reply.send({
      company: {
        id: updated.id,
        name: updated.name,
        companySetupComplete: updated.companySetupComplete,
      },
    });
  });
};

export default companyRoutes;
