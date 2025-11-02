import { FastifyInstance } from 'fastify';
import { AdminStatsController } from '../controllers/admin-stats.controller';
import { AdminStatsService } from '../services/admin-stats.service';

export async function adminStatsRoutes(fastify: FastifyInstance) {
  const service = new AdminStatsService(fastify.prisma);
  const controller = new AdminStatsController(service);

  // GET /admin/stats/overview - Overall system statistics
  fastify.get(
    '/overview',
    {
      preValidation: [fastify.authenticate, fastify.requireAdmin],
    },
    controller.getOverviewStats.bind(controller)
  );

  // GET /admin/stats/users - Detailed user analytics with filters
  fastify.get(
    '/users',
    {
      preValidation: [fastify.authenticate, fastify.requireAdmin],
    },
    controller.getUserAnalytics.bind(controller)
  );

  // GET /admin/stats/raids - Raid statistics with filters
  fastify.get(
    '/raids',
    {
      preValidation: [fastify.authenticate, fastify.requireAdmin],
    },
    controller.getRaidAnalytics.bind(controller)
  );

  // GET /admin/stats/dkp - DKP analytics with filters
  fastify.get(
    '/dkp',
    {
      preValidation: [fastify.authenticate, fastify.requireAdmin],
    },
    controller.getDkpAnalytics.bind(controller)
  );

  // GET /admin/stats/company-parties - Company party statistics
  fastify.get(
    '/company-parties',
    {
      preValidation: [fastify.authenticate, fastify.requireAdmin],
    },
    controller.getCompanyPartyStats.bind(controller)
  );

  // GET /admin/stats/activity - Recent activity feed
  fastify.get(
    '/activity',
    {
      preValidation: [fastify.authenticate, fastify.requireAdmin],
    },
    controller.getActivityFeed.bind(controller)
  );
}
