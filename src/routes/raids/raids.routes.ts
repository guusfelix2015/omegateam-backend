import type { FastifyPluginAsync } from 'fastify';
import { RaidsController } from './raids.controller.ts';
import { RaidService } from '@/modules/raids/raid.service.ts';
import { RaidRepository } from '@/modules/raids/raid.repository.ts';
import {
  type CreateRaidInput,
  type UpdateRaidInput,
  type GetRaidsQuery,
  type RaidParams,
} from './raids.schema.ts';

const raidsRoutes: FastifyPluginAsync = async fastify => {
  // Initialize dependencies
  const raidRepository = new RaidRepository(fastify.prisma);
  const raidService = new RaidService(raidRepository);
  const raidsController = new RaidsController(raidService);

  // GET /raids - List raids with pagination and filters
  fastify.get<{ Querystring: GetRaidsQuery }>('/', {
    preValidation: [fastify.authenticate],
    handler: async (request, reply) => {
      return raidsController.getRaids(request, reply);
    },
  });

  // GET /raids/active - Get active raids (must be before /:id route)
  fastify.get('/active', {
    preValidation: [fastify.authenticate],
    handler: async (request, reply) => {
      return raidsController.getActiveRaids(request, reply);
    },
  });

  // GET /raids/stats - Get raid statistics (must be before /:id route)
  fastify.get('/stats', {
    preValidation: [fastify.authenticate],
    handler: async (request, reply) => {
      return raidsController.getRaidStats(request, reply);
    },
  });

  // GET /raids/:id - Get raid by ID
  fastify.get<{ Params: RaidParams }>('/:id', {
    preValidation: [fastify.authenticate],
    handler: async (request, reply) => {
      return raidsController.getRaidById(request, reply);
    },
  });

  // POST /raids - Create new raid (ADMIN only)
  fastify.post<{ Body: CreateRaidInput }>('/', {
    preValidation: [fastify.authenticate, fastify.requireAdmin],
    handler: async (request, reply) => {
      return raidsController.createRaid(request, reply);
    },
  });

  // PUT /raids/:id - Update raid (ADMIN only)
  fastify.put<{ Params: RaidParams; Body: UpdateRaidInput }>('/:id', {
    preValidation: [fastify.authenticate, fastify.requireAdmin],
    handler: async (request, reply) => {
      return raidsController.updateRaid(request, reply);
    },
  });

  // DELETE /raids/:id - Delete raid (ADMIN only)
  fastify.delete<{ Params: RaidParams }>('/:id', {
    preValidation: [fastify.authenticate, fastify.requireAdmin],
    handler: async (request, reply) => {
      return raidsController.deleteRaid(request, reply);
    },
  });

  // PATCH /raids/:id/deactivate - Deactivate raid (ADMIN only)
  fastify.patch<{ Params: RaidParams }>('/:id/deactivate', {
    preValidation: [fastify.authenticate, fastify.requireAdmin],
    handler: async (request, reply) => {
      return raidsController.deactivateRaid(request, reply);
    },
  });

  // PATCH /raids/:id/activate - Activate raid (ADMIN only)
  fastify.patch<{ Params: RaidParams }>('/:id/activate', {
    preValidation: [fastify.authenticate, fastify.requireAdmin],
    handler: async (request, reply) => {
      return raidsController.activateRaid(request, reply);
    },
  });
};

export default raidsRoutes;
