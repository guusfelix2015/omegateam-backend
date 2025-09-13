import type { FastifyPluginAsync } from 'fastify';
import { UsersController } from './users.controller.ts';
import { UserService } from '@/modules/users/user.service.ts';
import {
  createUserJsonSchema,
  updateUserJsonSchema,
  updateProfileJsonSchema,
  getUsersQueryJsonSchema,
  usersListResponseJsonSchema,
  userJsonSchema,
  errorResponseJsonSchema,
} from './users.schema.js';
import type {
  CreateUserInput,
  UpdateUserInput,
  UpdateProfileInput,
  GetUsersQuery,
  UserParams,
} from './users.schema.js';

// eslint-disable-next-line @typescript-eslint/require-await
const usersRoutes: FastifyPluginAsync = async fastify => {
  const userService = new UserService(fastify.prisma);
  const usersController = new UsersController(userService);

  // GET /users - List users with pagination and filters
  fastify.get<{ Querystring: GetUsersQuery }>('/', {
    preValidation: [fastify.authenticate],
    schema: {
      description: 'List users with pagination and filters',
      tags: ['Users'],
      querystring: getUsersQueryJsonSchema,
      response: {
        200: usersListResponseJsonSchema,
        401: errorResponseJsonSchema,
      },
    },
    handler: async (request, reply) => {
      return usersController.getUsers(request, reply);
    },
  });

  // GET /users/:id - Get user by ID
  fastify.get<{ Params: UserParams }>('/:id', {
    preValidation: [fastify.authenticate],
    schema: {
      description: 'Get user by ID',
      tags: ['Users'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      response: {
        200: userJsonSchema,
        401: errorResponseJsonSchema,
        404: errorResponseJsonSchema,
      },
    },
    handler: async (request, reply) => {
      return usersController.getUserById(request, reply);
    },
  });

  // POST /users - Create new user (ADMIN only)
  fastify.post<{ Body: CreateUserInput }>('/', {
    preValidation: [fastify.authenticate, fastify.requireAdmin],
    schema: {
      description: 'Create new user (ADMIN only)',
      tags: ['Users'],
      body: createUserJsonSchema,
      response: {
        201: userJsonSchema,
        400: errorResponseJsonSchema,
        401: errorResponseJsonSchema,
        403: errorResponseJsonSchema,
        409: errorResponseJsonSchema,
      },
    },
    handler: async (request, reply) => {
      return usersController.createUser(request, reply);
    },
  });

  // PUT /users/:id - Update user
  fastify.put<{ Params: UserParams; Body: UpdateUserInput }>('/:id', {
    preValidation: [fastify.authenticate],
    schema: {
      description: 'Update user',
      tags: ['Users'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      body: updateUserJsonSchema,
      response: {
        200: userJsonSchema,
        400: errorResponseJsonSchema,
        401: errorResponseJsonSchema,
        403: errorResponseJsonSchema,
        404: errorResponseJsonSchema,
        409: errorResponseJsonSchema,
      },
    },
    handler: async (request, reply) => {
      return usersController.updateUser(request, reply);
    },
  });

  // DELETE /users/:id - Delete user
  fastify.delete<{ Params: UserParams }>('/:id', {
    preValidation: [fastify.authenticate],
    schema: {
      description: 'Delete user',
      tags: ['Users'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      response: {
        204: { type: 'null' },
        401: errorResponseJsonSchema,
        403: errorResponseJsonSchema,
        404: errorResponseJsonSchema,
      },
    },
    handler: async (request, reply) => {
      return usersController.deleteUser(request, reply);
    },
  });

  // PUT /users/profile - Update current user profile (restricted fields)
  fastify.put<{ Body: UpdateProfileInput }>('/profile', {
    preValidation: [fastify.authenticate],
    schema: {
      description: 'Update current user profile (restricted fields)',
      tags: ['Users'],
      body: updateProfileJsonSchema,
      response: {
        200: userJsonSchema,
        400: errorResponseJsonSchema,
        401: errorResponseJsonSchema,
        404: errorResponseJsonSchema,
      },
    },
    handler: async (request, reply) => {
      return usersController.updateProfile(request, reply);
    },
  });

  // GET /users/stats - Get user statistics
  fastify.get('/stats', {
    preValidation: [fastify.authenticate],
    schema: {
      description: 'Get user statistics',
      tags: ['Users'],
      response: {
        200: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            active: { type: 'number' },
            inactive: { type: 'number' },
            admins: { type: 'number' },
            players: { type: 'number' },
          },
        },
        401: errorResponseJsonSchema,
      },
    },
    handler: async (request, reply) => {
      return usersController.getUserStats(request, reply);
    },
  });
};

export default usersRoutes;
