import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { env } from '@/libs/env.ts';

const swaggerPlugin: FastifyPluginAsync = async fastify => {
  if (!env.SWAGGER_ENABLED) {
    fastify.log.info('📚 Swagger disabled via environment');
    return;
  }

  // Register Swagger
  await fastify.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'Lineage CP Backend API',
        description:
          'Backend minimalista porém robusto com Fastify + TypeScript',
        version: '1.0.0',
        contact: {
          name: 'Lineage CP Team',
          email: 'dev@lineage.com',
        },
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
    },
    transform: ({ schema, url }) => {
      // Transform schemas to include proper examples
      return {
        schema,
        url,
      };
    },
  });

  // Register Swagger UI
  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
    },
    uiHooks: {
      onRequest: async (request, reply) => {
        // Optional: Add authentication for Swagger UI in production
        if (env.SWAGGER_AUTH_REQUIRED && env.NODE_ENV === 'production') {
          // Simple basic auth check - in real app, use proper auth
          const auth = request.headers.authorization;
          if (!auth || !auth.startsWith('Basic ')) {
            reply.code(401).header('WWW-Authenticate', 'Basic').send({
              error: 'Authentication required for API documentation',
            });
            return;
          }
        }
      },
    },
    staticCSP: false,
  });

  fastify.log.info('📚 Swagger documentation available at /docs');
};

export default fp(swaggerPlugin, {
  name: 'swagger',
});
