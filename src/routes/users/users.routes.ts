import type { FastifyPluginAsync } from 'fastify';
import { UsersController } from './users.controller.ts';
import { UserService } from '@/modules/users/user.service.ts';
// JSON Schema imports removed - Swagger disabled
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

  // DELETE /users/:id - Delete user
  fastify.delete<{ Params: UserParams }>('/:id', {
    preValidation: [fastify.authenticate],
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
