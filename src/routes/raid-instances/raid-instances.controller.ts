import type { FastifyRequest, FastifyReply } from 'fastify';
import type {
  CreateRaidInstanceInput,
  CreateRaidInstanceWithItemsInput,
  GetRaidInstancesQuery,
  RaidInstanceParams,
} from '@/routes/raids/raids.schema.ts';
import { RaidInstanceService } from '@/modules/raid-instances/raid-instance.service.ts';

export class RaidInstancesController {
  private raidInstanceService: RaidInstanceService;

  constructor(raidInstanceService: RaidInstanceService) {
    this.raidInstanceService = raidInstanceService;
  }

  async getRaidInstances(
    request: FastifyRequest<{ Querystring: GetRaidInstancesQuery }>,
    reply: FastifyReply
  ) {
    const result = await this.raidInstanceService.getRaidInstances(request.query);
    return reply.status(200).send(result);
  }

  async getRaidInstanceById(
    request: FastifyRequest<{ Params: RaidInstanceParams }>,
    reply: FastifyReply
  ) {
    const raidInstance = await this.raidInstanceService.getRaidInstanceById(
      request.params.id
    );
    return reply.status(200).send(raidInstance);
  }

  async createRaidInstance(
    request: FastifyRequest<{ Body: CreateRaidInstanceInput }>,
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

    const raidInstance = await this.raidInstanceService.createRaidInstance(
      request.body,
      request.user.id
    );
    return reply.status(201).send(raidInstance);
  }

  async createRaidInstanceWithItems(
    request: FastifyRequest<{ Body: CreateRaidInstanceWithItemsInput }>,
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

    const raidInstance = await this.raidInstanceService.createRaidInstanceWithItems(
      request.body,
      request.user.id
    );
    return reply.status(201).send(raidInstance);
  }

  async deleteRaidInstance(
    request: FastifyRequest<{ Params: RaidInstanceParams }>,
    reply: FastifyReply
  ) {
    await this.raidInstanceService.deleteRaidInstance(request.params.id);
    return reply.status(200).send({
      message: 'Raid instance deleted successfully',
    });
  }

  async getRaidInstanceStats(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const stats = await this.raidInstanceService.getRaidInstanceStats();
    return reply.status(200).send(stats);
  }

  async getRecentRaidInstances(
    request: FastifyRequest<{ Querystring: { limit?: number } }>,
    reply: FastifyReply
  ) {
    const limit = request.query.limit || 5;
    const raidInstances = await this.raidInstanceService.getRecentRaidInstances(limit);
    return reply.status(200).send({ data: raidInstances });
  }

  async previewDkpCalculation(
    request: FastifyRequest<{
      Body: {
        raidId: string;
        participantIds: string[];
      };
    }>,
    reply: FastifyReply
  ) {
    const { raidId, participantIds } = request.body;
    const preview = await this.raidInstanceService.previewDkpCalculation(
      raidId,
      participantIds
    );
    return reply.status(200).send(preview);
  }

  async addParticipant(
    request: FastifyRequest<{
      Body: { userId: string };
      Params: RaidInstanceParams;
    }>,
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

    const { id: raidInstanceId } = request.params;
    const { userId } = request.body;

    const participant = await this.raidInstanceService.addParticipant(
      raidInstanceId,
      userId,
      request.user.id
    );
    return reply.status(201).send(participant);
  }

  async removeParticipant(
    request: FastifyRequest<{
      Params: RaidInstanceParams & { userId: string };
    }>,
    reply: FastifyReply
  ) {
    const { id: raidInstanceId, userId } = request.params;

    await this.raidInstanceService.removeParticipant(raidInstanceId, userId);
    return reply.status(200).send({
      message: 'Participant removed successfully',
    });
  }
}
