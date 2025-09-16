import type { FastifyPluginAsync } from 'fastify';
import { ItemsController } from '@/routes/items/items.controller.ts';
import { ItemService } from '@/modules/items/item.service.ts';
import { ItemRepository } from '@/modules/items/item.repository.ts';

const lookupsRoutes: FastifyPluginAsync = async fastify => {
  // Initialize dependencies for items lookups
  const itemRepository = new ItemRepository(fastify.prisma);
  const itemService = new ItemService(itemRepository);
  const itemsController = new ItemsController(itemService);

  // GET /lookups/categories - Return array of valid item categories
  fastify.get('/categories', {
    handler: async (request, reply) => {
      return itemsController.getCategories(request, reply);
    },
  });

  // GET /lookups/grades - Return array of valid item grades
  fastify.get('/grades', {
    handler: async (request, reply) => {
      return itemsController.getGrades(request, reply);
    },
  });

  // GET /lookups - Return object with both categories and grades
  fastify.get('/', {
    handler: async (request, reply) => {
      return itemsController.getLookups(request, reply);
    },
  });
};

export default lookupsRoutes;
