import type { FastifyRequest, FastifyReply } from 'fastify';
import type {
  CreateRaidInput,
  UpdateRaidInput,
  GetRaidsQuery,
  RaidParams,
} from './raids.schema.ts';
import { RaidService } from '@/modules/raids/raid.service.ts';

export class RaidsController {
  private raidService: RaidService;

  constructor(raidService: RaidService) {
    this.raidService = raidService;
  }

  async getRaids(
    request: FastifyRequest<{ Querystring: GetRaidsQuery }>,
    reply: FastifyReply
  ) {
    const result = await this.raidService.getRaids(request.query);
    return reply.status(200).send(result);
  }

  async getRaidById(
    request: FastifyRequest<{ Params: RaidParams }>,
    reply: FastifyReply
  ) {
    const raid = await this.raidService.getRaidById(request.params.id);
    return reply.status(200).send(raid);
  }

  async createRaid(
    request: FastifyRequest<{ Body: CreateRaidInput }>,
    reply: FastifyReply
  ) {
    const raid = await this.raidService.createRaid(request.body);
    return reply.status(201).send(raid);
  }

  async updateRaid(
    request: FastifyRequest<{
      Params: RaidParams;
      Body: UpdateRaidInput;
    }>,
    reply: FastifyReply
  ) {
    const raid = await this.raidService.updateRaid(
      request.params.id,
      request.body
    );
    return reply.status(200).send(raid);
  }

  async deleteRaid(
    request: FastifyRequest<{ Params: RaidParams }>,
    reply: FastifyReply
  ) {
    await this.raidService.deleteRaid(request.params.id);
    return reply.status(200).send({
      message: 'Raid deleted successfully',
    });
  }

  async deactivateRaid(
    request: FastifyRequest<{ Params: RaidParams }>,
    reply: FastifyReply
  ) {
    const raid = await this.raidService.deactivateRaid(request.params.id);
    return reply.status(200).send(raid);
  }

  async activateRaid(
    request: FastifyRequest<{ Params: RaidParams }>,
    reply: FastifyReply
  ) {
    const raid = await this.raidService.activateRaid(request.params.id);
    return reply.status(200).send(raid);
  }

  async getActiveRaids(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const raids = await this.raidService.getActiveRaids();
    return reply.status(200).send({ data: raids });
  }

  async getRaidStats(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const stats = await this.raidService.getRaidStats();
    return reply.status(200).send(stats);
  }
}
