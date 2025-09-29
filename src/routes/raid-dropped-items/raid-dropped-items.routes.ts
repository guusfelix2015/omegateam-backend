import type { FastifyPluginAsync } from 'fastify';

const raidDroppedItemsRoutes: FastifyPluginAsync = async fastify => {
  // Test route first
  fastify.get('/test', async (_request, _reply) => {
    return { message: 'Raid dropped items routes working!' };
  });

  // Simple stats route
  fastify.get('/stats', {
    preValidation: [fastify.authenticate],
    handler: async (_request, _reply) => {
      return {
        total: 0,
        totalByCategory: {},
        totalByGrade: {},
        averageMinDkpBid: 0,
      };
    },
  });

  // Simple list route
  fastify.get('/', {
    preValidation: [fastify.authenticate],
    handler: async (_request, _reply) => {
      return {
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    },
  });
};

export default raidDroppedItemsRoutes;
