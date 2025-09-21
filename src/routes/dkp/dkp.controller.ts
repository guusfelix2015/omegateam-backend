import type { FastifyRequest, FastifyReply } from 'fastify';
import type {
  DkpAdjustmentInput,
  DkpLeaderboardQuery,
  DkpHistoryQuery,
  UserParams,
} from './dkp.schema.ts';
import { DkpService } from '@/modules/dkp/dkp.service.ts';

export class DkpController {
  private dkpService: DkpService;

  constructor(dkpService: DkpService) {
    this.dkpService = dkpService;
  }

  async createManualAdjustment(
    request: FastifyRequest<{ Body: DkpAdjustmentInput }>,
    reply: FastifyReply
  ) {
    if (!request.user) {
      return reply.status(401).send({
        error: {
          message: 'Authentication required',
          statusCode: 401,
        },
      });
    }

    const transaction = await this.dkpService.createManualAdjustment(
      request.body,
      request.user.id
    );
    return reply.status(201).send(transaction);
  }

  async getDkpLeaderboard(
    request: FastifyRequest<{ Querystring: DkpLeaderboardQuery }>,
    reply: FastifyReply
  ) {
    const result = await this.dkpService.getDkpLeaderboard(request.query);
    return reply.status(200).send(result);
  }

  async getUserDkpHistory(
    request: FastifyRequest<{
      Params: UserParams;
      Querystring: DkpHistoryQuery;
    }>,
    reply: FastifyReply
  ) {
    const result = await this.dkpService.getUserDkpHistory(
      request.params.id,
      request.query
    );
    return reply.status(200).send(result);
  }

  async getUserDkpSummary(
    request: FastifyRequest<{ Params: UserParams }>,
    reply: FastifyReply
  ) {
    const summary = await this.dkpService.getUserDkpSummary(request.params.id);
    return reply.status(200).send(summary);
  }

  async getCurrentUserDkpHistory(
    request: FastifyRequest<{ Querystring: DkpHistoryQuery }>,
    reply: FastifyReply
  ) {
    if (!request.user) {
      return reply.status(401).send({
        error: {
          message: 'Authentication required',
          statusCode: 401,
        },
      });
    }

    const result = await this.dkpService.getUserDkpHistory(
      request.user.id,
      request.query
    );
    return reply.status(200).send(result);
  }

  async getCurrentUserDkpSummary(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    if (!request.user) {
      return reply.status(401).send({
        error: {
          message: 'Authentication required',
          statusCode: 401,
        },
      });
    }

    const summary = await this.dkpService.getUserDkpSummary(request.user.id);
    return reply.status(200).send(summary);
  }

  async getDkpStats(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const stats = await this.dkpService.getDkpStats();
    return reply.status(200).send(stats);
  }
}
