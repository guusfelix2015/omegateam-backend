import type { FastifyPluginAsync } from 'fastify';
import { DkpController } from './dkp.controller.ts';
import { DkpService } from '@/modules/dkp/dkp.service.ts';
import { DkpRepository } from '@/modules/dkp/dkp.repository.ts';
import { UserRepository } from '@/modules/users/user.repository.ts';
import {
  type DkpAdjustmentInput,
  type DkpLeaderboardQuery,
  type DkpHistoryQuery,
  type UserParams,
} from './dkp.schema.ts';

const dkpRoutes: FastifyPluginAsync = async fastify => {
  // Initialize dependencies
  const dkpRepository = new DkpRepository(fastify.prisma);
  const userRepository = new UserRepository(fastify.prisma);
  const dkpService = new DkpService(dkpRepository, userRepository);
  const dkpController = new DkpController(dkpService);

  // GET /dkp/leaderboard - Get DKP leaderboard
  fastify.get<{ Querystring: DkpLeaderboardQuery }>('/leaderboard', {
    preValidation: [fastify.authenticate],
    handler: async (request, reply) => {
      return dkpController.getDkpLeaderboard(request, reply);
    },
  });

  // GET /dkp/stats - Get DKP statistics
  fastify.get('/stats', {
    preValidation: [fastify.authenticate],
    handler: async (request, reply) => {
      return dkpController.getDkpStats(request, reply);
    },
  });

  // GET /dkp/my-history - Get current user's DKP history
  fastify.get<{ Querystring: DkpHistoryQuery }>('/my-history', {
    preValidation: [fastify.authenticate],
    handler: async (request, reply) => {
      return dkpController.getCurrentUserDkpHistory(request, reply);
    },
  });

  // GET /dkp/my-summary - Get current user's DKP summary
  fastify.get('/my-summary', {
    preValidation: [fastify.authenticate],
    handler: async (request, reply) => {
      return dkpController.getCurrentUserDkpSummary(request, reply);
    },
  });

  // POST /dkp/adjustments - Create manual DKP adjustment (ADMIN only)
  fastify.post<{ Body: DkpAdjustmentInput }>('/adjustments', {
    preValidation: [fastify.authenticate, fastify.requireAdmin],
    handler: async (request, reply) => {
      return dkpController.createManualAdjustment(request, reply);
    },
  });

  // GET /dkp/users/:id/history - Get specific user's DKP history (authenticated users)
  fastify.get<{
    Params: UserParams;
    Querystring: DkpHistoryQuery;
  }>('/users/:id/history', {
    preValidation: [fastify.authenticate],
    handler: async (request, reply) => {
      return dkpController.getUserDkpHistory(request, reply);
    },
  });

  // GET /dkp/users/:id/summary - Get specific user's DKP summary (authenticated users)
  fastify.get<{ Params: UserParams }>('/users/:id/summary', {
    preValidation: [fastify.authenticate],
    handler: async (request, reply) => {
      return dkpController.getUserDkpSummary(request, reply);
    },
  });
};

export default dkpRoutes;
