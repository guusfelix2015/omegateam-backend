import { PrismaClient } from '@prisma/client';
import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

const prismaPlugin: FastifyPluginAsync = async fastify => {
  const prisma = new PrismaClient({
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'stdout' },
      { level: 'warn', emit: 'stdout' },
    ],
  });

  // Log queries in development
  if (process.env['NODE_ENV'] === 'development') {
    prisma.$on('query', e => {
      fastify.log.debug(
        {
          query: e.query,
          params: e.params,
          duration: `${e.duration}ms`,
        },
        'Prisma query'
      );
    });
  }

  // Test connection
  try {
    await prisma.$connect();
    fastify.log.info('✅ Database connected successfully');
  } catch (error) {
    fastify.log.error('❌ Database connection failed');
    fastify.log.error(error);
    throw error;
  }

  // Decorate fastify instance
  fastify.decorate('prisma', prisma);

  // Graceful shutdown
  fastify.addHook('onClose', async () => {
    fastify.log.info('Disconnecting from database...');
    await prisma.$disconnect();
  });
};

export default fp(prismaPlugin, {
  name: 'prisma',
});
