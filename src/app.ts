import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { env, isDev } from '@/libs/env.ts';
import { errorHandler } from '@/libs/errors.ts';
import { authenticate, requireAdmin, requirePlayer } from '@/libs/auth.ts';

// Plugins
import prismaPlugin from '@/plugins/prisma.ts';
import securityPlugin from '@/plugins/security.ts';

// Routes
import indexRoutes from '@/routes/index.ts';
import usersRoutes from '@/routes/users/users.routes.ts';
import companyPartiesRoutes from '@/routes/company-parties/company-parties.routes.ts';
import classesRoutes from '@/routes/classes/classes.routes.ts';
import itemsRoutes from '@/routes/items/items.routes.ts';
import lookupsRoutes from '@/routes/lookups/lookups.routes.ts';

export async function createApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport: isDev
        ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
        : undefined,
    },
    disableRequestLogging: !isDev,
    trustProxy: true,
  });

  // Register error handler
  app.setErrorHandler(errorHandler);

  // Register plugins
  await app.register(prismaPlugin);
  await app.register(securityPlugin);

  // Decorate with auth middleware
  app.decorate('authenticate', authenticate);
  app.decorate('requireAdmin', requireAdmin);
  app.decorate('requirePlayer', requirePlayer);

  // Register routes
  await app.register(indexRoutes);
  await app.register(usersRoutes, { prefix: '/users' });
  await app.register(companyPartiesRoutes, { prefix: '/company-parties' });
  await app.register(classesRoutes, { prefix: '/classes' });
  await app.register(itemsRoutes, { prefix: '/items' });
  await app.register(lookupsRoutes, { prefix: '/lookups' });

  // 404 handler
  app.setNotFoundHandler(async (request, reply) => {
    return reply.status(404).send({
      error: {
        message: `Route ${request.method} ${request.url} not found`,
        statusCode: 404,
      },
    });
  });

  // Log registered routes in development
  if (isDev) {
    app.ready(() => {
      app.log.info('🚀 Registered routes:');
      app.log.info(app.printRoutes({ commonPrefix: false }));
    });
  }

  return app;
}
