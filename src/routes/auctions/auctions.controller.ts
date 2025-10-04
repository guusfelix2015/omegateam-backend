/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { FastifyRequest, FastifyReply } from 'fastify';
import type { AuctionService } from '@/modules/auctions/auction.service.ts';
import type {
  CreateAuctionInput,
  CreateBidInput,
  AuctionParams,
  GetAuctionsQuery,
  ResetAuctionedFlagInput,
  GetWonItemsQuery,
} from './auctions.schema.ts';

export class AuctionsController {
  constructor(private auctionService: AuctionService) { }

  // Create auction (ADMIN only)
  async createAuction(
    request: FastifyRequest<{ Body: CreateAuctionInput }>,
    reply: FastifyReply
  ): Promise<void> {
    const userId = request.user!.id;
    const auction = await this.auctionService.createAuction({
      ...request.body,
      createdBy: userId,
    });

    return reply.status(201).send(auction);
  }

  // Start auction (ADMIN only)
  async startAuction(
    request: FastifyRequest<{ Params: AuctionParams }>,
    reply: FastifyReply
  ): Promise<void> {
    const userId = request.user!.id;
    const auction = await this.auctionService.startAuction(request.params.id, userId);

    return reply.send(auction);
  }

  // Get auctions
  async getAuctions(
    request: FastifyRequest<{ Querystring: GetAuctionsQuery }>,
    reply: FastifyReply
  ): Promise<void> {
    // Convert query params to proper types
    const options: any = { ...request.query };

    // Convert page and limit to numbers
    if (request.query.page) options.page = Number(request.query.page);
    if (request.query.limit) options.limit = Number(request.query.limit);

    // Convert date strings to Date objects if provided
    if (request.query.dateFrom) options.dateFrom = new Date(request.query.dateFrom);
    if (request.query.dateTo) options.dateTo = new Date(request.query.dateTo);

    const result = await this.auctionService.getAuctions(options);

    const totalPages = Math.ceil(result.total / result.limit);

    return reply.send({
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages,
        hasNext: result.page < totalPages,
        hasPrev: result.page > 1,
      },
    });
  }

  // Get auction by ID
  async getAuctionById(
    request: FastifyRequest<{ Params: AuctionParams }>,
    reply: FastifyReply
  ): Promise<void> {
    const auction = await this.auctionService.getAuctionById(request.params.id);
    return reply.send(auction);
  }

  // Get active auction
  async getActiveAuction(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const auction = await this.auctionService.getActiveAuction();
    // Return null instead of 404 when no active auction
    return reply.send(auction);
  }

  // Place bid
  async placeBid(
    request: FastifyRequest<{ Body: CreateBidInput }>,
    reply: FastifyReply
  ): Promise<void> {
    const userId = request.user!.id;
    const auction = await this.auctionService.placeBid({
      ...request.body,
      userId,
    });

    return reply.send(auction);
  }

  // Finalize auction item (ADMIN only)
  async finalizeAuctionItem(
    request: FastifyRequest<{ Params: { itemId: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    await this.auctionService.finalizeAuctionItem(request.params.itemId);
    return reply.status(200).send({ message: 'Item finalizado com sucesso' });
  }

  // Get my won items
  async getMyWonItems(
    request: FastifyRequest<{ Querystring: GetWonItemsQuery }>,
    reply: FastifyReply
  ): Promise<void> {
    const userId = request.user!.id;

    // Convert date strings to Date objects if provided
    const options: any = {};
    if (request.query.dateFrom) options.dateFrom = new Date(request.query.dateFrom);
    if (request.query.dateTo) options.dateTo = new Date(request.query.dateTo);
    if (request.query.itemCategory) options.itemCategory = request.query.itemCategory;
    if (request.query.itemGrade) options.itemGrade = request.query.itemGrade;

    const wonItems = await this.auctionService.getUserWonItems(userId, options);

    return reply.send(wonItems);
  }

  // Get user's won items (authenticated users can view any user)
  async getUserWonItems(
    request: FastifyRequest<{ Params: { userId: string }; Querystring: GetWonItemsQuery }>,
    reply: FastifyReply
  ): Promise<void> {
    // Convert date strings to Date objects if provided
    const options: any = {};
    if (request.query.dateFrom) options.dateFrom = new Date(request.query.dateFrom);
    if (request.query.dateTo) options.dateTo = new Date(request.query.dateTo);
    if (request.query.itemCategory) options.itemCategory = request.query.itemCategory;
    if (request.query.itemGrade) options.itemGrade = request.query.itemGrade;

    const wonItems = await this.auctionService.getUserWonItems(request.params.userId, options);
    return reply.send(wonItems);
  }

  // Cancel auction (ADMIN only)
  async cancelAuction(
    request: FastifyRequest<{ Params: AuctionParams }>,
    reply: FastifyReply
  ): Promise<void> {
    const userId = request.user!.id;
    const auction = await this.auctionService.cancelAuction(request.params.id, userId);

    return reply.send(auction);
  }

  // Get auctioned items
  async getAuctionedItems(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const items = await this.auctionService.getAuctionedItems();
    return reply.send(items);
  }

  // Reset auctioned flag (ADMIN only)
  async resetAuctionedFlag(
    request: FastifyRequest<{ Body: ResetAuctionedFlagInput }>,
    reply: FastifyReply
  ): Promise<void> {
    const userId = request.user!.id;
    await this.auctionService.resetAuctionedFlag(
      request.body.itemId,
      userId,
      request.body.reason
    );

    return reply.status(200).send({ message: 'Flag resetada com sucesso' });
  }

  // Get audit logs
  async getAuditLogs(
    request: FastifyRequest<{ Querystring: { entityId?: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    const logs = await this.auctionService.getAuditLogs(request.query.entityId);
    return reply.send(logs);
  }

  // Get auction analytics (ADMIN only)
  async getAuctionAnalytics(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const analytics = await this.auctionService.getAuctionAnalytics();
    return reply.send(analytics);
  }
}

