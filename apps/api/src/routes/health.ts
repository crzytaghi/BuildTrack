import type { FastifyInstance } from 'fastify';

const healthRoutes = async (app: FastifyInstance) => {
  app.get('/health', async () => ({ ok: true }));
};

export default healthRoutes;
