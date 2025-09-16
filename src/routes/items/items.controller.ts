import type { FastifyRequest, FastifyReply } from 'fastify';
import type {
  CreateItemInput,
  UpdateItemInput,
  GetItemsQuery,
  ItemParams,
} from './items.schema.ts';
import { ItemService } from '@/modules/items/item.service.ts';

export class ItemsController {
  private itemService: ItemService;

  constructor(itemService: ItemService) {
    this.itemService = itemService;
  }

  async getItems(
    request: FastifyRequest<{ Querystring: GetItemsQuery }>,
    reply: FastifyReply
  ) {
    const result = await this.itemService.getItems(request.query);
    return reply.status(200).send(result);
  }

  async getItemById(
    request: FastifyRequest<{ Params: ItemParams }>,
    reply: FastifyReply
  ) {
    const item = await this.itemService.getItemById(request.params.id);
    return reply.status(200).send(item);
  }

  async createItem(
    request: FastifyRequest<{ Body: CreateItemInput }>,
    reply: FastifyReply
  ) {
    const item = await this.itemService.createItem(request.body);
    return reply.status(201).send({
      data: item,
      message: 'Item created successfully',
    });
  }

  async updateItem(
    request: FastifyRequest<{
      Params: ItemParams;
      Body: UpdateItemInput;
    }>,
    reply: FastifyReply
  ) {
    const item = await this.itemService.updateItem(
      request.params.id,
      request.body
    );
    return reply.status(200).send({
      data: item,
      message: 'Item updated successfully',
    });
  }

  async deleteItem(
    request: FastifyRequest<{ Params: ItemParams }>,
    reply: FastifyReply
  ) {
    await this.itemService.deleteItem(request.params.id);
    return reply.status(200).send({
      message: 'Item deleted successfully',
    });
  }

  async getItemStats(_request: FastifyRequest, reply: FastifyReply) {
    const stats = await this.itemService.getItemStats();
    return reply.status(200).send(stats);
  }

  // Lookup endpoints
  async getCategories(_request: FastifyRequest, reply: FastifyReply) {
    const categories = [
      'HELMET',
      'ARMOR',
      'PANTS',
      'BOOTS',
      'GLOVES',
      'NECKLACE',
      'EARRING',
      'RING',
      'SHIELD',
      'WEAPON',
    ];
    return reply.status(200).send({ data: categories });
  }

  async getGrades(_request: FastifyRequest, reply: FastifyReply) {
    const grades = ['D', 'C', 'B', 'A', 'S'];
    return reply.status(200).send({ data: grades });
  }

  async getLookups(_request: FastifyRequest, reply: FastifyReply) {
    const categories = [
      'HELMET',
      'ARMOR',
      'PANTS',
      'BOOTS',
      'GLOVES',
      'NECKLACE',
      'EARRING',
      'RING',
      'SHIELD',
      'WEAPON',
    ];
    const grades = ['D', 'C', 'B', 'A', 'S'];
    
    return reply.status(200).send({
      categories,
      grades,
    });
  }
}
