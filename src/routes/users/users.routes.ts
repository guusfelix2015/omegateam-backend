import type { FastifyPluginAsync } from 'fastify';
import { UsersController } from './users.controller.ts';
import { UserService } from '@/modules/users/user.service.ts';
import type {
  CreateUserInput,
  UpdateUserInput,
  UpdateProfileInput,
  GetUsersQuery,
  UserParams,
} from './users.schema.ts';

const usersRoutes: FastifyPluginAsync = async fastify => {
  // Initialize dependencies
  const userService = new UserService(fastify.prisma);
  const usersController = new UsersController(userService);

  // GET /users - List users with pagination and filters
  fastify.get<{ Querystring: GetUsersQuery }>('/', {
    preValidation: [fastify.authenticate],
    handler: async (request, reply) => {
      return usersController.getUsers(request, reply);
    },
  });

  // GET /users/stats - Get user statistics (must be before /:id route)
  fastify.get('/stats', {
    preValidation: [fastify.authenticate],
    handler: async (request, reply) => {
      return usersController.getUserStats(request, reply);
    },
  });

  // GET /users/:id - Get user by ID
  fastify.get<{ Params: UserParams }>('/:id', {
    preValidation: [fastify.authenticate],
    handler: async (request, reply) => {
      return usersController.getUserById(request, reply);
    },
  });

  // POST /users - Create new user (ADMIN only)
  fastify.post<{ Body: CreateUserInput }>('/', {
    preValidation: [fastify.authenticate, fastify.requireAdmin],
    handler: async (request, reply) => {
      return usersController.createUser(request, reply);
    },
  });

  // PUT /users/:id - Update user
  fastify.put<{ Params: UserParams; Body: UpdateUserInput }>('/:id', {
    preValidation: [fastify.authenticate],
    handler: async (request, reply) => {
      return usersController.updateUser(request, reply);
    },
  });

  // DELETE /users/:id - Delete user (ADMIN only)
  fastify.delete<{ Params: UserParams }>('/:id', {
    preValidation: [fastify.authenticate, fastify.requireAdmin],
    schema: {
      description: 'Delete user by ID (ADMIN only)',
      tags: ['Users'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'User ID' },
        },
        required: ['id'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
        400: {
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
        403: {
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
        404: {
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
      return usersController.deleteUser(request, reply);
    },
  });

  // PUT /users/:id/profile - Update user profile (self or admin)
  fastify.put<{ Params: UserParams; Body: UpdateProfileInput }>(
    '/:id/profile',
    {
      preValidation: [fastify.authenticate],
      handler: async (request, reply) => {
        return usersController.updateProfile(request, reply);
      },
    }
  );
};

export default usersRoutes;
