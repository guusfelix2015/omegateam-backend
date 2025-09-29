import type { FastifyPluginAsync } from 'fastify';
import { RaidDroppedItemsController } from './raid-dropped-items.controller.ts';
import { RaidDroppedItemService } from '@/modules/raid-dropped-items/raid-dropped-item.service.ts';
import { RaidDroppedItemRepository } from '@/modules/raid-dropped-items/raid-dropped-item.repository.ts';
import { RaidInstanceRepository } from '@/modules/raid-instances/raid-instance.repository.ts';
import type {
  GetRaidDroppedItemsQuery,
  RaidDroppedItemParams,
  UpdateRaidDroppedItemInput,
} from './raid-dropped-items.schema.ts';

const raidDroppedItemsRoutes: FastifyPluginAsync = async fastify => {
  // Initialize dependencies
  const raidDroppedItemRepository = new RaidDroppedItemRepository(fastify.prisma);
  const raidInstanceRepository = new RaidInstanceRepository(fastify.prisma);
  const raidDroppedItemService = new RaidDroppedItemService(
    raidDroppedItemRepository,
    raidInstanceRepository
  );
  const raidDroppedItemsController = new RaidDroppedItemsController(raidDroppedItemService);

  // GET /raid-dropped-items - List all dropped items with pagination and filters
  fastify.get<{ Querystring: GetRaidDroppedItemsQuery }>('/', {
    preValidation: [fastify.authenticate],
    handler: async (request, reply) => {
      return raidDroppedItemsController.getRaidDroppedItems(request, reply);
    },
  });

  // GET /raid-dropped-items/stats - Get dropped items statistics
  fastify.get('/stats', {
    preValidation: [fastify.authenticate],
    handler: async (request, reply) => {
      return raidDroppedItemsController.getRaidDroppedItemStats(request, reply);
    },
  });

  // GET /raid-dropped-items/:id - Get specific dropped item by ID
  fastify.get<{ Params: RaidDroppedItemParams }>('/:id', {
    preValidation: [fastify.authenticate],
    handler: async (request, reply) => {
      return raidDroppedItemsController.getRaidDroppedItemById(request, reply);
    },
  });

  // PUT /raid-dropped-items/:id - Update dropped item (ADMIN only)
  fastify.put<{
    Params: RaidDroppedItemParams;
    Body: UpdateRaidDroppedItemInput;
  }>('/:id', {
    preValidation: [fastify.authenticate, fastify.requireAdmin],
    handler: async (request, reply) => {
      return raidDroppedItemsController.updateRaidDroppedItem(request, reply);
    },
  });

  // DELETE /raid-dropped-items/:id - Delete dropped item (ADMIN only)
  fastify.delete<{ Params: RaidDroppedItemParams }>('/:id', {
    preValidation: [fastify.authenticate, fastify.requireAdmin],
    handler: async (request, reply) => {
      return raidDroppedItemsController.deleteRaidDroppedItem(request, reply);
    },
  });
};

export default raidDroppedItemsRoutes;
