import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { AdminStatsService } from '../services/admin-stats.service';
import { Clan, PlayerType } from '@prisma/client';

const userAnalyticsSchema = z.object({
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  clan: z.nativeEnum(Clan).optional(),
  playerType: z.nativeEnum(PlayerType).optional(),
  classId: z.string().optional(),
  levelMin: z.coerce.number().min(1).max(85).optional(),
  levelMax: z.coerce.number().min(1).max(85).optional(),
});

const raidAnalyticsSchema = z.object({
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  raidId: z.string().optional(),
});

const dkpAnalyticsSchema = z.object({
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  userId: z.string().optional(),
});

const activityFeedSchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional(),
});

export class AdminStatsController {
  constructor(private service: AdminStatsService) {}

  async getOverviewStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const stats = await this.service.getOverviewStats();
      return reply.status(200).send(stats);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: 'Failed to fetch overview statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getUserAnalytics(
    request: FastifyRequest<{ Querystring: z.infer<typeof userAnalyticsSchema> }>,
    reply: FastifyReply
  ) {
    try {
      const query = userAnalyticsSchema.parse(request.query);

      const filters = {
        dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
        dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
        clan: query.clan,
        playerType: query.playerType,
        classId: query.classId,
        levelMin: query.levelMin,
        levelMax: query.levelMax,
      };

      const analytics = await this.service.getUserAnalytics(filters);
      return reply.status(200).send(analytics);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Invalid query parameters',
          details: error.errors,
        });
      }

      request.log.error(error);
      return reply.status(500).send({
        error: 'Failed to fetch user analytics',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getRaidAnalytics(
    request: FastifyRequest<{ Querystring: z.infer<typeof raidAnalyticsSchema> }>,
    reply: FastifyReply
  ) {
    try {
      const query = raidAnalyticsSchema.parse(request.query);

      const filters = {
        dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
        dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
        raidId: query.raidId,
      };

      const analytics = await this.service.getRaidAnalytics(filters);
      return reply.status(200).send(analytics);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Invalid query parameters',
          details: error.errors,
        });
      }

      request.log.error(error);
      return reply.status(500).send({
        error: 'Failed to fetch raid analytics',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getDkpAnalytics(
    request: FastifyRequest<{ Querystring: z.infer<typeof dkpAnalyticsSchema> }>,
    reply: FastifyReply
  ) {
    try {
      const query = dkpAnalyticsSchema.parse(request.query);

      const filters = {
        dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
        dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
        userId: query.userId,
      };

      const analytics = await this.service.getDkpAnalytics(filters);
      return reply.status(200).send(analytics);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Invalid query parameters',
          details: error.errors,
        });
      }

      request.log.error(error);
      return reply.status(500).send({
        error: 'Failed to fetch DKP analytics',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getCompanyPartyStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const stats = await this.service.getCompanyPartyStats();
      return reply.status(200).send(stats);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: 'Failed to fetch company party statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getActivityFeed(
    request: FastifyRequest<{ Querystring: z.infer<typeof activityFeedSchema> }>,
    reply: FastifyReply
  ) {
    try {
      const query = activityFeedSchema.parse(request.query);
      const activities = await this.service.getActivityFeed(query.limit);
      return reply.status(200).send(activities);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Invalid query parameters',
          details: error.errors,
        });
      }

      request.log.error(error);
      return reply.status(500).send({
        error: 'Failed to fetch activity feed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
