/* eslint-disable @typescript-eslint/no-explicit-any */
import type { FastifyPluginAsync, FastifyReply } from 'fastify';
import { UsersController } from './users.controller.ts';
import { UserService } from '@/modules/users/user.service.ts';
import type {
  CreateUserInput,
  UpdateUserInput,
  UpdateProfileInput,
  GetUsersQuery,
  UserParams,
  UpdateUserGearInput,
} from './users.schema.ts';
import { getUsersQuerySchema } from './users.schema.ts';

const usersRoutes: FastifyPluginAsync = async fastify => {
  // Initialize dependencies
  const userService = new UserService(fastify.prisma);
  const usersController = new UsersController(userService);

  // GET /users - List users with pagination and filters
  fastify.get<{ Querystring: GetUsersQuery }>('/', {
    preValidation: [fastify.authenticate],
    handler: async (request, reply) => {
      // Manually validate and transform query parameters
      const validatedQuery = getUsersQuerySchema.parse(request.query);
      request.query = validatedQuery;
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

  // GET /users/me - Get current user's profile (must be before /:id route)
  fastify.get<{ Params: UserParams }>('/me', {
    preValidation: [fastify.authenticate],
    handler: async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({
          error: {
            message: 'Authentication required',
            statusCode: 401,
          },
        });
      }

      // Create a properly typed request object for getUserById
      const typedRequest = {
        ...request,
        params: { id: request.user.id }
      } as typeof request & { params: UserParams };

      return usersController.getUserById(typedRequest, reply);
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
    handler: async (request, reply) => {
      return usersController.deleteUser(request, reply);
    },
  });

  // PUT /users/profile - Update current user's profile
  fastify.put<{ Body: UpdateProfileInput }>('/profile', {
    preValidation: [fastify.authenticate],
    handler: async (request, reply) => {
      return usersController.updateProfile(request, reply);
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

  // GET /users/profile/gear - Get current user's gear
  fastify.get('/profile/gear', {
    preValidation: [fastify.authenticate],
    handler: async (request, reply) => {
      return usersController.getUserGear(request, reply);
    },
  });

  // PUT /users/profile/gear - Update current user's gear
  fastify.put<{ Body: UpdateUserGearInput }>('/profile/gear', {
    preValidation: [fastify.authenticate],
    handler: async (request, reply) => {
      return usersController.updateUserGear(request, reply);
    },
  });

  // GET /users/:id/gear - Get specific user's gear (ADMIN only)
  fastify.get<{ Params: UserParams }>('/:id/gear', {
    preValidation: [fastify.authenticate, fastify.requireAdmin],
    handler: async (request, reply): Promise<FastifyReply> => {
      return usersController.getUserGearById(request, reply);
    },
  });

  // GET /users/cp-members - Get CP members for current user (allows PLAYER to see members of their CPs)
  fastify.get('/cp-members', {
    preValidation: [fastify.authenticate],
    handler: async (request, reply) => {
      return usersController.getCPMembers(request, reply);
    },
  });
};

export default usersRoutes;
