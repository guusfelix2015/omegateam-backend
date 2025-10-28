import type { FastifyInstance } from 'fastify';
import { UserInactivityService } from '@/modules/users/user-inactivity.service.ts';
import { ForbiddenError } from '@/libs/errors.ts';

export async function userInactivityRoutes(fastify: FastifyInstance) {
  const userInactivityService = new UserInactivityService(fastify.prisma);

  /**
   * GET /users/inactivity/stats
   * Obtém estatísticas de inatividade de usuários
   * Apenas ADMIN pode acessar
   */
  fastify.get(
    '/users/inactivity/stats',
    {
      preValidation: [fastify.authenticate],
      schema: {
        description: 'Get user inactivity statistics',
        tags: ['Users', 'Inactivity'],
        response: {
          200: {
            type: 'object',
            properties: {
              totalUsers: { type: 'number' },
              activeUsers: { type: 'number' },
              inactiveUsers: { type: 'number' },
              usersNeverLoggedIn: { type: 'number' },
              potentiallyInactiveUsers: { type: 'number' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      // Only ADMIN can access
      if (request.user?.role !== 'ADMIN') {
        throw new ForbiddenError('Only administrators can access inactivity statistics');
      }

      const stats = await userInactivityService.getInactivityStats(7);
      return reply.status(200).send(stats);
    }
  );

  /**
   * GET /users/inactivity/list
   * Lista todos os usuários inativos (isActive: false)
   * Apenas ADMIN pode acessar
   */
  fastify.get(
    '/users/inactivity/list',
    {
      preValidation: [fastify.authenticate],
      schema: {
        description: 'Get list of all inactive users',
        tags: ['Users', 'Inactivity'],
        querystring: {
          type: 'object',
          properties: {
            days: { type: 'number', default: 7 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              users: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    email: { type: 'string' },
                    name: { type: 'string' },
                    lastLoginAt: { type: 'string', nullable: true },
                  },
                },
              },
              count: { type: 'number' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      // Only ADMIN can access
      if (request.user?.role !== 'ADMIN') {
        throw new ForbiddenError('Only administrators can access inactive users list');
      }

      // First, mark any users who have become inactive since last check
      const days = (request.query as { days?: number }).days ?? 7;
      await userInactivityService.markInactiveUsers(days);

      // Then, return all inactive users
      const inactiveUsers = await userInactivityService.getInactiveUsersList();

      return reply.status(200).send({
        users: inactiveUsers.map(user => ({
          id: user.id,
          email: user.email,
          name: user.name,
          lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
        })),
        count: inactiveUsers.length,
      });
    }
  );

  /**
   * GET /users/:userId/last-login
   * Obtém informações de último login de um usuário
   * Usuário pode ver suas próprias informações, ADMIN pode ver de qualquer um
   */
  fastify.get(
    '/users/:userId/last-login',
    {
      preValidation: [fastify.authenticate],
      schema: {
        description: 'Get user last login information',
        tags: ['Users', 'Inactivity'],
        params: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
          },
          required: ['userId'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              lastLoginAt: { type: 'string', nullable: true },
              daysSinceLastLogin: { type: 'number', nullable: true },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { userId } = request.params as { userId: string };

      // User can only see their own info, unless they're ADMIN
      if (request.user?.id !== userId && request.user?.role !== 'ADMIN') {
        throw new ForbiddenError('You can only view your own login information');
      }

      const info = await userInactivityService.getUserLastLoginInfo(userId);

      if (!info) {
        return reply.status(404).send({
          error: {
            message: 'User not found',
            statusCode: 404,
          },
        });
      }

      return reply.status(200).send(info);
    }
  );

  /**
   * POST /users/:userId/reactivate
   * Reativa um usuário inativo
   * Apenas ADMIN pode fazer isso
   */
  fastify.post(
    '/users/:userId/reactivate',
    {
      preValidation: [fastify.authenticate],
      schema: {
        description: 'Reactivate an inactive user',
        tags: ['Users', 'Inactivity'],
        params: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
          },
          required: ['userId'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              isActive: { type: 'boolean' },
              lastLoginAt: { type: 'string', nullable: true },
            },
          },
        },
      },
    },
    async (request, reply) => {
      // Only ADMIN can reactivate users
      if (request.user?.role !== 'ADMIN') {
        throw new ForbiddenError('Only administrators can reactivate users');
      }

      const { userId } = request.params as { userId: string };

      const user = await userInactivityService.reactivateUser(userId);

      return reply.status(200).send({
        id: user.id,
        email: user.email,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      });
    }
  );
}

