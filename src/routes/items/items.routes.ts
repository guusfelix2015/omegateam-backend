import type { FastifyPluginAsync } from 'fastify';
import { ItemsController } from './items.controller.ts';
import { ItemService } from '@/modules/items/item.service.ts';
import { ItemRepository } from '@/modules/items/item.repository.ts';
import {
  type CreateItemInput,
  type UpdateItemInput,
  type GetItemsQuery,
  type ItemParams,
} from './items.schema.ts';

const itemsRoutes: FastifyPluginAsync = async fastify => {
  // Initialize dependencies
  const itemRepository = new ItemRepository(fastify.prisma);
  const itemService = new ItemService(itemRepository);
  const itemsController = new ItemsController(itemService);

  // GET /items - List items with pagination and filters
  fastify.get<{ Querystring: GetItemsQuery }>('/', {
    preValidation: [fastify.authenticate],
    handler: async (request, reply) => {
      return itemsController.getItems(request, reply);
    },
  });

  // GET /items/stats - Get item statistics (must be before /:id route)
  fastify.get('/stats', {
    preValidation: [fastify.authenticate],
    handler: async (request, reply) => {
      return itemsController.getItemStats(request, reply);
    },
  });

  // GET /items/:id - Get item by ID
  fastify.get<{ Params: ItemParams }>('/:id', {
    preValidation: [fastify.authenticate],
    handler: async (request, reply) => {
      return itemsController.getItemById(request, reply);
    },
  });

  // POST /items - Create new item (ADMIN only)
  fastify.post<{ Body: CreateItemInput }>('/', {
    preValidation: [fastify.authenticate, fastify.requireAdmin],
    handler: async (request, reply) => {
      return itemsController.createItem(request, reply);
    },
  });

  // PUT /items/:id - Update item (ADMIN only)
  fastify.put<{ Params: ItemParams; Body: UpdateItemInput }>('/:id', {
    preValidation: [fastify.authenticate, fastify.requireAdmin],
    handler: async (request, reply) => {
      return itemsController.updateItem(request, reply);
    },
  });

  // DELETE /items/:id - Delete item (ADMIN only)
  fastify.delete<{ Params: ItemParams }>('/:id', {
    preValidation: [fastify.authenticate, fastify.requireAdmin],
    handler: async (request, reply) => {
      return itemsController.deleteItem(request, reply);
    },
  });
};

export default itemsRoutes;
