import type { FastifyRequest, FastifyReply } from 'fastify';
import type {
  CreateUserInput,
  UpdateUserInput,
  UpdateProfileInput,
  GetUsersQuery,
  UserParams,
  UpdateUserGearInput,
} from './users.schema.ts';
import { UserService } from '@/modules/users/user.service.ts';

export class UsersController {
  private userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
  }

  async getUsers(
    request: FastifyRequest<{ Querystring: GetUsersQuery }>,
    reply: FastifyReply
  ) {
    const result = await this.userService.getUsers(request.query);

    return reply.status(200).send(result);
  }

  async getUserById(
    request: FastifyRequest<{ Params: UserParams }>,
    reply: FastifyReply
  ) {
    const user = await this.userService.getUserById(request.params.id);

    return reply.status(200).send(user);
  }

  async createUser(
    request: FastifyRequest<{ Body: CreateUserInput }>,
    reply: FastifyReply
  ) {
    const user = await this.userService.createUser(request.body);

    return reply.status(201).send(user);
  }

  async updateUser(
    request: FastifyRequest<{
      Params: UserParams;
      Body: UpdateUserInput;
    }>,
    reply: FastifyReply
  ) {
    const user = await this.userService.updateUser(
      request.params.id,
      request.body
    );

    return reply.status(200).send(user);
  }

  async deleteUser(
    request: FastifyRequest<{ Params: UserParams }>,
    reply: FastifyReply
  ) {
    // Prevent user from deleting themselves
    if (request.user && request.user.id === request.params.id) {
      return reply.status(400).send({
        error: {
          message: 'You cannot delete your own account',
          statusCode: 400,
        },
      });
    }

    await this.userService.deleteUser(request.params.id);

    return reply.status(200).send({
      message: 'User deleted successfully',
    });
  }

  async updateProfile(
    request: FastifyRequest<{ Body: UpdateProfileInput }>,
    reply: FastifyReply
  ) {
    if (!request.user) {
      return reply.status(401).send({
        error: {
          message: 'Authentication required',
          statusCode: 401,
        },
      });
    }

    const userId = request.user.id;
    const user = await this.userService.updateProfile(userId, request.body);

    return reply.status(200).send(user);
  }

  async getUserStats(_request: FastifyRequest, reply: FastifyReply) {
    const stats = await this.userService.getUserStats();

    return reply.status(200).send(stats);
  }

  async getUserGear(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    if (!request.user) {
      return reply.status(401).send({
        error: {
          message: 'Authentication required',
          statusCode: 401,
        },
      });
    }

    const userId = request.user.id;
    const gear = await this.userService.getUserGear(userId);

    return reply.status(200).send(gear);
  }

  async updateUserGear(
    request: FastifyRequest<{ Body: UpdateUserGearInput }>,
    reply: FastifyReply
  ) {
    if (!request.user) {
      return reply.status(401).send({
        error: {
          message: 'Authentication required',
          statusCode: 401,
        },
      });
    }

    const userId = request.user.id;
    const gear = await this.userService.updateUserGear(userId, request.body);

    return reply.status(200).send(gear);
  }
}
