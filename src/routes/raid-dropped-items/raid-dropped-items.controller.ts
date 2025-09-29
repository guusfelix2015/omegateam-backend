import type { FastifyRequest, FastifyReply } from 'fastify';
import type {
  CreateRaidDroppedItemInput,
  UpdateRaidDroppedItemInput,
  GetRaidDroppedItemsQuery,
  RaidDroppedItemParams,
  RaidInstanceParams,
} from './raid-dropped-items.schema.ts';
import { RaidDroppedItemService } from '@/modules/raid-dropped-items/raid-dropped-item.service.ts';

export class RaidDroppedItemsController {
  private raidDroppedItemService: RaidDroppedItemService;

  constructor(raidDroppedItemService: RaidDroppedItemService) {
    this.raidDroppedItemService = raidDroppedItemService;
  }

  async getRaidDroppedItems(
    request: FastifyRequest<{ Querystring: GetRaidDroppedItemsQuery }>,
    reply: FastifyReply
  ): Promise<FastifyReply> {
    // Convert query parameters to proper types
    const query = {
      ...request.query,
      page: request.query.page ? Number(request.query.page) : undefined,
      limit: request.query.limit ? Number(request.query.limit) : undefined,
    };

    const result = await this.raidDroppedItemService.getRaidDroppedItems(query);
    return reply.status(200).send(result);
  }

  async getRaidDroppedItemById(
    request: FastifyRequest<{ Params: RaidDroppedItemParams }>,
    reply: FastifyReply
  ): Promise<FastifyReply> {
    const droppedItem = await this.raidDroppedItemService.getRaidDroppedItemById(
      request.params.id
    );
    return reply.status(200).send(droppedItem);
  }

  async getRaidDroppedItemsByRaidInstanceId(
    request: FastifyRequest<{ Params: RaidInstanceParams }>,
    reply: FastifyReply
  ): Promise<FastifyReply> {
    const droppedItems = await this.raidDroppedItemService.getRaidDroppedItemsByRaidInstanceId(
      request.params.raidInstanceId
    );
    return reply.status(200).send({ data: droppedItems });
  }

  async createRaidDroppedItem(
    request: FastifyRequest<{
      Body: CreateRaidDroppedItemInput;
      Params: RaidInstanceParams;
    }>,
    reply: FastifyReply
  ): Promise<FastifyReply> {
    if (!request.user) {
      return reply.status(401).send({
        error: {
          message: 'Authentication required',
          statusCode: 401,
        },
      });
    }

    const createData = {
      ...request.body,
      raidInstanceId: request.params.raidInstanceId,
    };

    const droppedItem = await this.raidDroppedItemService.createRaidDroppedItem(
      createData,
      request.user.id
    );
    return reply.status(201).send(droppedItem);
  }

  async updateRaidDroppedItem(
    request: FastifyRequest<{
      Body: UpdateRaidDroppedItemInput;
      Params: RaidDroppedItemParams;
    }>,
    reply: FastifyReply
  ): Promise<FastifyReply> {
    const droppedItem = await this.raidDroppedItemService.updateRaidDroppedItem(
      request.params.id,
      request.body
    );
    return reply.status(200).send(droppedItem);
  }

  async deleteRaidDroppedItem(
    request: FastifyRequest<{ Params: RaidDroppedItemParams }>,
    reply: FastifyReply
  ): Promise<FastifyReply> {
    await this.raidDroppedItemService.deleteRaidDroppedItem(request.params.id);
    return reply.status(200).send({
      message: 'Item dropado removido com sucesso',
    });
  }

  async getRaidDroppedItemStats(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<FastifyReply> {
    const stats = await this.raidDroppedItemService.getRaidDroppedItemStats();
    return reply.status(200).send(stats);
  }
}
