import type { FastifyPluginAsync } from 'fastify';
import { RaidInstancesController } from './raid-instances.controller.ts';
import { RaidInstanceService } from '@/modules/raid-instances/raid-instance.service.ts';
import { RaidInstanceRepository } from '@/modules/raid-instances/raid-instance.repository.ts';
import { RaidRepository } from '@/modules/raids/raid.repository.ts';
import { UserRepository } from '@/modules/users/user.repository.ts';
import { DkpRepository } from '@/modules/dkp/dkp.repository.ts';
import { RaidDroppedItemsController } from '@/routes/raid-dropped-items/raid-dropped-items.controller.ts';
import { RaidDroppedItemService } from '@/modules/raid-dropped-items/raid-dropped-item.service.ts';
import { RaidDroppedItemRepository } from '@/modules/raid-dropped-items/raid-dropped-item.repository.ts';
import {
  type CreateRaidInstanceInput,
  type CreateRaidInstanceWithItemsInput,
  type GetRaidInstancesQuery,
  type RaidInstanceParams,
} from '@/routes/raids/raids.schema.ts';
import {
  type CreateRaidDroppedItemInput,
  type RaidInstanceParams as DroppedItemRaidInstanceParams,
} from '@/routes/raid-dropped-items/raid-dropped-items.schema.ts';

const raidInstancesRoutes: FastifyPluginAsync = async fastify => {
  // Initialize dependencies
  const raidInstanceRepository = new RaidInstanceRepository(fastify.prisma);
  const raidRepository = new RaidRepository(fastify.prisma);
  const userRepository = new UserRepository(fastify.prisma);
  const dkpRepository = new DkpRepository(fastify.prisma);

  // Initialize dropped items dependencies
  const raidDroppedItemRepository = new RaidDroppedItemRepository(fastify.prisma);

  const raidInstanceService = new RaidInstanceService(
    fastify.prisma,
    raidInstanceRepository,
    raidRepository,
    userRepository,
    dkpRepository,
    raidDroppedItemRepository
  );

  const raidInstancesController = new RaidInstancesController(raidInstanceService);

  // Initialize dropped items service
  const raidDroppedItemService = new RaidDroppedItemService(
    raidDroppedItemRepository,
    raidInstanceRepository
  );
  const raidDroppedItemsController = new RaidDroppedItemsController(raidDroppedItemService);

  // GET /raid-instances - List raid instances with pagination and filters
  fastify.get<{ Querystring: GetRaidInstancesQuery }>('/', {
    preValidation: [fastify.authenticate],
    handler: async (request, reply) => {
      return raidInstancesController.getRaidInstances(request, reply);
    },
  });

  // GET /raid-instances/recent - Get recent raid instances (must be before /:id route)
  fastify.get<{ Querystring: { limit?: number } }>('/recent', {
    preValidation: [fastify.authenticate],
    handler: async (request, reply) => {
      return raidInstancesController.getRecentRaidInstances(request, reply);
    },
  });

  // GET /raid-instances/stats - Get raid instance statistics (must be before /:id route)
  fastify.get('/stats', {
    preValidation: [fastify.authenticate],
    handler: async (request, reply) => {
      return raidInstancesController.getRaidInstanceStats(request, reply);
    },
  });

  // POST /raid-instances/preview-dkp - Preview DKP calculation (must be before /:id route)
  fastify.post<{
    Body: {
      raidId: string;
      participantIds: string[];
    };
  }>('/preview-dkp', {
    preValidation: [fastify.authenticate, fastify.requireAdmin],
    handler: async (request, reply) => {
      return raidInstancesController.previewDkpCalculation(request, reply);
    },
  });

  // GET /raid-instances/:id - Get raid instance by ID
  fastify.get<{ Params: RaidInstanceParams }>('/:id', {
    preValidation: [fastify.authenticate],
    handler: async (request, reply) => {
      return raidInstancesController.getRaidInstanceById(request, reply);
    },
  });

  // POST /raid-instances - Create new raid instance (ADMIN only)
  fastify.post<{ Body: CreateRaidInstanceInput }>('/', {
    preValidation: [fastify.authenticate, fastify.requireAdmin],
    handler: async (request, reply) => {
      return raidInstancesController.createRaidInstance(request, reply);
    },
  });

  // POST /raid-instances/with-items - Create new raid instance with dropped items (ADMIN only)
  fastify.post<{ Body: CreateRaidInstanceWithItemsInput }>('/with-items', {
    preValidation: [fastify.authenticate, fastify.requireAdmin],
    handler: async (request, reply) => {
      return raidInstancesController.createRaidInstanceWithItems(request, reply);
    },
  });

  // DELETE /raid-instances/:id - Delete raid instance (ADMIN only)
  fastify.delete<{ Params: RaidInstanceParams }>('/:id', {
    preValidation: [fastify.authenticate, fastify.requireAdmin],
    handler: async (request, reply) => {
      return raidInstancesController.deleteRaidInstance(request, reply);
    },
  });

  // GET /raid-instances/:raidInstanceId/dropped-items - List dropped items for specific raid instance
  fastify.get<{ Params: DroppedItemRaidInstanceParams }>('/:raidInstanceId/dropped-items', {
    preValidation: [fastify.authenticate],
    handler: async (request, reply) => {
      return raidDroppedItemsController.getRaidDroppedItemsByRaidInstanceId(request, reply);
    },
  });

  // POST /raid-instances/:id/participants - Add participant to raid instance (ADMIN only)
  fastify.post<{
    Body: { userId: string };
    Params: RaidInstanceParams;
  }>('/:id/participants', {
    preValidation: [fastify.authenticate, fastify.requireAdmin],
    handler: async (request, reply) => {
      return raidInstancesController.addParticipant(request, reply);
    },
  });

  // DELETE /raid-instances/:id/participants/:userId - Remove participant from raid instance (ADMIN only)
  fastify.delete<{
    Params: RaidInstanceParams & { userId: string };
  }>('/:id/participants/:userId', {
    preValidation: [fastify.authenticate, fastify.requireAdmin],
    handler: async (request, reply) => {
      return raidInstancesController.removeParticipant(request, reply);
    },
  });

  // POST /raid-instances/:raidInstanceId/dropped-items - Add dropped item to raid instance (ADMIN only)
  fastify.post<{
    Body: CreateRaidDroppedItemInput;
    Params: DroppedItemRaidInstanceParams;
  }>('/:raidInstanceId/dropped-items', {
    preValidation: [fastify.authenticate, fastify.requireAdmin],
    handler: async (request, reply) => {
      return raidDroppedItemsController.createRaidDroppedItem(request, reply);
    },
  });
};

export default raidInstancesRoutes;
