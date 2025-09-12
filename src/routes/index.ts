import type { FastifyPluginAsync } from 'fastify';
import { login } from '@/libs/auth.js';
import { z } from 'zod';

// eslint-disable-next-line @typescript-eslint/require-await
const indexRoutes: FastifyPluginAsync = async (fastify) => {
  // Health check endpoint
  fastify.get('/health', {
    schema: {
      description: 'Health check endpoint',
      tags: ['System'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            uptime: { type: 'number' },
            environment: { type: 'string' },
          },
        },
      },
    },
    handler: async (_request, reply) => {
      return reply.status(200).send({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env['NODE_ENV'] ?? 'development',
      });
    },
  });

  // Ready check endpoint (includes database connectivity)
  fastify.get('/ready', {
    schema: {
      description: 'Readiness check endpoint',
      tags: ['System'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            database: { type: 'string' },
          },
        },
        503: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            error: { type: 'string' },
          },
        },
      },
    },
    handler: async (_request, reply) => {
      try {
        // Test database connection
        await fastify.prisma.$queryRaw`SELECT 1`;

        return reply.status(200).send({
          status: 'ready',
          timestamp: new Date().toISOString(),
          database: 'connected',
        });
      } catch (error) {
        return reply.status(503).send({
          status: 'not ready',
          timestamp: new Date().toISOString(),
          error: 'Database connection failed',
        });
      }
    },
  });

  // Version endpoint
  fastify.get('/version', {
    schema: {
      description: 'API version information',
      tags: ['System'],
      response: {
        200: {
          type: 'object',
          properties: {
            version: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            node: { type: 'string' },
          },
        },
      },
    },
    handler: async (_request, reply) => {
      // In a real app, you might read this from package.json
      return reply.status(200).send({
        version: '1.0.0',
        name: 'Lineage CP Backend',
        description:
          'Backend minimalista porém robusto com Fastify + TypeScript',
        node: process.version,
      });
    },
  });

  // Demo login endpoint
  fastify.post('/auth/login', {
    schema: {
      description: 'Demo login endpoint',
      tags: ['Authentication'],
      body: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 1 },
        },
        required: ['email', 'password'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            message: { type: 'string' },
          },
        },
        401: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                statusCode: { type: 'number' },
              },
            },
          },
        },
      },
    },
    handler: async (request, reply) => {
      const loginSchema = z.object({
        email: z.string().email(),
        password: z.string().min(1),
      });

      const { email, password } = loginSchema.parse(request.body);
      const token = await login(email, password, fastify.prisma);

      return reply.status(200).send({
        token,
        message: 'Login successful',
      });
    },
  });

  // Get current user endpoint
  fastify.get('/auth/me', {
    preValidation: [fastify.authenticate],
    schema: {
      description: 'Get current user information',
      tags: ['Authentication'],
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
            nickname: { type: 'string' },
            role: { type: 'string', enum: ['ADMIN', 'PLAYER', 'CP_LEADER'] },
            isActive: { type: 'boolean' },
            lvl: { type: 'number' },
            classeId: { type: 'string', nullable: true },
            classe: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                createdAt: { type: 'string' },
              },
            },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' },
          },
        },
        401: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                statusCode: { type: 'number' },
              },
            },
          },
        },
      },
    },
    handler: async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({
          error: {
            message: 'Authentication required',
            statusCode: 401,
          },
        });
      }

      // Get full user data from database
      const user = await fastify.prisma.user.findUnique({
        where: { id: request.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          nickname: true,
          role: true,
          isActive: true,
          lvl: true,
          classeId: true,
          createdAt: true,
          updatedAt: true,
          classe: {
            select: {
              id: true,
              name: true,
              createdAt: true,
            },
          },
        },
      });

      if (!user) {
        return reply.status(404).send({
          error: {
            message: 'User not found',
            statusCode: 404,
          },
        });
      }

      return reply.status(200).send({
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        classe: user.classe ? {
          ...user.classe,
          createdAt: user.classe.createdAt.toISOString(),
        } : null,
      });
    },
  });


};

export default indexRoutes;
