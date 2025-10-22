import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { env, isDev } from '@/libs/env.ts';
import { errorHandler } from '@/libs/errors.ts';
import { authenticate, requireAdmin, requirePlayer } from '@/libs/auth.ts';
import multipart from '@fastify/multipart';

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
import raidsRoutes from '@/routes/raids/raids.routes.ts';
import raidInstancesRoutes from '@/routes/raid-instances/raid-instances.routes.ts';

import raidDroppedItemsRoutes from '@/routes/raid-dropped-items/raid-dropped-items.routes.ts';
import raidAttendanceRoutes from '@/routes/raid-attendance/raid-attendance.routes.ts';
import dkpRoutes from '@/routes/dkp/dkp.routes.ts';
import auctionsRoutes from '@/routes/auctions/auctions.routes.ts';
import uploadRoutes from '@/routes/upload/upload.routes.ts';

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

  // Register multipart for file uploads
  await app.register(multipart, {
    limits: {
      fileSize: 20 * 1024 * 1024, // 20MB max file size
    },
  });

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
  await app.register(raidsRoutes, { prefix: '/raids' });
  await app.register(raidInstancesRoutes, { prefix: '/raid-instances' });
  await app.register(raidAttendanceRoutes, { prefix: '/raid-instances' });
  await app.register(raidDroppedItemsRoutes, { prefix: '/raid-dropped-items' });
  await app.register(dkpRoutes, { prefix: '/dkp' });
  await app.register(auctionsRoutes, { prefix: '/auctions' });
  await app.register(uploadRoutes, { prefix: '/upload' });

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
