import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { PrismaClient } from '@prisma/client';

type CompanyPluginOptions = {
  prisma: PrismaClient;
  requireAuth: (req: any, reply: any, done: any) => void;
};

const companyRoutes = async (app: FastifyInstance, options: CompanyPluginOptions) => {
  const { prisma, requireAuth } = options;

  app.get('/company/me', { preHandler: requireAuth }, async () => {
    const company = await prisma.company.findFirst();
    if (!company) {
      return { company: null };
    }
    return {
      company: {
        id: company.id,
        name: company.name,
        companySetupComplete: company.companySetupComplete,
      },
    };
  });

  app.post('/company/setup', { preHandler: requireAuth }, async (req, reply) => {
    const body = z
      .object({
        name: z.string().min(1),
      })
      .parse(req.body);

    const company = await prisma.company.findFirst();
    if (!company) {
      const created = await prisma.company.create({
        data: {
          name: body.name,
          companySetupComplete: true,
        },
      });
      return reply.code(201).send({
        company: {
          id: created.id,
          name: created.name,
          companySetupComplete: created.companySetupComplete,
        },
      });
    }

    const updated = await prisma.company.update({
      where: { id: company.id },
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
