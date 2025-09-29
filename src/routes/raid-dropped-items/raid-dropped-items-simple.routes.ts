import type { FastifyPluginAsync } from 'fastify';

const raidDroppedItemsSimpleRoutes: FastifyPluginAsync = async fastify => {
  // Test route
  fastify.get('/test', async (_request, _reply) => {
    return { message: 'Simple raid dropped items routes working!' };
  });

  // Stats route
  fastify.get('/stats', {
    preValidation: [fastify.authenticate],
    handler: async (_request, _reply) => {
      try {
        // Get all dropped items for stats
        const allItems = await fastify.prisma.raidDroppedItem.findMany({
          include: {
            raidInstance: {
              include: {
                raid: true,
              },
            },
          },
        });

        const total = allItems.length;
        const totalByCategory: Record<string, number> = {};
        const totalByGrade: Record<string, number> = {};
        let totalMinDkpBid = 0;

        allItems.forEach(item => {
          totalByCategory[item.category] = (totalByCategory[item.category] || 0) + 1;
          totalByGrade[item.grade] = (totalByGrade[item.grade] || 0) + 1;
          totalMinDkpBid += item.minDkpBid;
        });

        const averageMinDkpBid = total > 0 ? totalMinDkpBid / total : 0;

        return {
          total,
          totalByCategory,
          totalByGrade,
          averageMinDkpBid: Math.round(averageMinDkpBid * 100) / 100,
        };
      } catch (error) {
        fastify.log.error('Error getting raid dropped items stats:', error);
        return _reply.status(500).send({ error: 'Internal server error' });
      }
    },
  });

  // List route
  fastify.get('/', {
    preValidation: [fastify.authenticate],
    handler: async (request, _reply) => {
      try {
        const query = request.query as any;
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 20;
        const sortBy = query.sortBy || 'droppedAt';
        const sortOrder = query.sortOrder || 'desc';
        const category = query.category;
        const grade = query.grade;

        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {};
        if (category) where.category = category;
        if (grade) where.grade = grade;

        // Build orderBy clause
        const orderBy: any = {};
        orderBy[sortBy] = sortOrder;

        // Get total count
        const total = await fastify.prisma.raidDroppedItem.count({ where });

        // Get items
        const items = await fastify.prisma.raidDroppedItem.findMany({
          where,
          include: {
            raidInstance: {
              include: {
                raid: true,
              },
            },
          },
          orderBy,
          skip,
          take: limit,
        });

        const totalPages = Math.ceil(total / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;

        return {
          data: items,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext,
            hasPrev,
          },
        };
      } catch (error) {
        fastify.log.error('Error getting raid dropped items:', error);
        return _reply.status(500).send({ error: 'Internal server error' });
      }
    },
  });
};

export default raidDroppedItemsSimpleRoutes;
