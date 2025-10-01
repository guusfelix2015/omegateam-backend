import type { FastifyPluginAsync } from 'fastify';
import { AuctionsController } from './auctions.controller.ts';
import { AuctionService } from '@/modules/auctions/auction.service.ts';
import { AuctionRepository } from '@/modules/auctions/auction.repository.ts';
import { DkpRepository } from '@/modules/dkp/dkp.repository.ts';
import { UserRepository } from '@/modules/users/user.repository.ts';
import type {
  CreateAuctionInput,
  CreateBidInput,
  AuctionParams,
  GetAuctionsQuery,
  ResetAuctionedFlagInput,
} from './auctions.schema.ts';

const auctionsRoutes: FastifyPluginAsync = async (fastify) => {
  // Initialize dependencies
  const auctionRepository = new AuctionRepository(fastify.prisma);
  const dkpRepository = new DkpRepository(fastify.prisma);
  const userRepository = new UserRepository(fastify.prisma);
  const auctionService = new AuctionService(auctionRepository, dkpRepository, userRepository);
  const auctionsController = new AuctionsController(auctionService);

  // GET /auctions - List auctions with pagination
  fastify.get<{ Querystring: GetAuctionsQuery }>('/', {
    preValidation: [fastify.authenticate],
    handler: async (request, reply) => {
      return auctionsController.getAuctions(request, reply);
    },
  });

  // GET /auctions/active - Get active auction (must be before /:id route)
  fastify.get('/active', {
    preValidation: [fastify.authenticate],
    handler: async (request, reply) => {
      return auctionsController.getActiveAuction(request, reply);
    },
  });

  // GET /auctions/my-won-items - Get current user's won items
  fastify.get('/my-won-items', {
    preValidation: [fastify.authenticate],
    handler: async (request, reply) => {
      return auctionsController.getMyWonItems(request, reply);
    },
  });

  // GET /auctions/:id - Get auction by ID
  fastify.get<{ Params: AuctionParams }>('/:id', {
    preValidation: [fastify.authenticate],
    handler: async (request, reply) => {
      return auctionsController.getAuctionById(request, reply);
    },
  });

  // POST /auctions - Create new auction (ADMIN only)
  fastify.post<{ Body: CreateAuctionInput }>('/', {
    preValidation: [fastify.authenticate, fastify.requireAdmin],
    handler: async (request, reply) => {
      return auctionsController.createAuction(request, reply);
    },
  });

  // POST /auctions/:id/start - Start auction (ADMIN only)
  fastify.post<{ Params: AuctionParams }>('/:id/start', {
    preValidation: [fastify.authenticate, fastify.requireAdmin],
    handler: async (request, reply) => {
      return auctionsController.startAuction(request, reply);
    },
  });

  // POST /auctions/bids - Place a bid
  fastify.post<{ Body: CreateBidInput }>('/bids', {
    preValidation: [fastify.authenticate],
    handler: async (request, reply) => {
      return auctionsController.placeBid(request, reply);
    },
  });

  // POST /auctions/items/:itemId/finalize - Finalize auction item (ADMIN only)
  fastify.post<{ Params: { itemId: string } }>('/items/:itemId/finalize', {
    preValidation: [fastify.authenticate, fastify.requireAdmin],
    handler: async (request, reply) => {
      return auctionsController.finalizeAuctionItem(request, reply);
    },
  });

  // POST /auctions/:id/cancel - Cancel auction (ADMIN only)
  fastify.post<{ Params: AuctionParams }>('/:id/cancel', {
    preValidation: [fastify.authenticate, fastify.requireAdmin],
    handler: async (request, reply) => {
      return auctionsController.cancelAuction(request, reply);
    },
  });

  // GET /auctions/users/:userId/won-items - Get specific user's won items
  fastify.get<{ Params: { userId: string } }>('/users/:userId/won-items', {
    preValidation: [fastify.authenticate],
    handler: async (request, reply) => {
      return auctionsController.getUserWonItems(request, reply);
    },
  });

  // GET /auctions/auctioned-items - Get all auctioned items (ADMIN only)
  fastify.get('/auctioned-items', {
    preValidation: [fastify.authenticate, fastify.requireAdmin],
    handler: async (request, reply) => {
      return auctionsController.getAuctionedItems(request, reply);
    },
  });

  // POST /auctions/reset-auctioned-flag - Reset hasBeenAuctioned flag (ADMIN only)
  fastify.post<{ Body: ResetAuctionedFlagInput }>('/reset-auctioned-flag', {
    preValidation: [fastify.authenticate, fastify.requireAdmin],
    handler: async (request, reply) => {
      return auctionsController.resetAuctionedFlag(request, reply);
    },
  });

  // GET /auctions/audit-logs - Get audit logs (ADMIN only)
  fastify.get<{ Querystring: { entityId?: string } }>('/audit-logs', {
    preValidation: [fastify.authenticate, fastify.requireAdmin],
    handler: async (request, reply) => {
      return auctionsController.getAuditLogs(request, reply);
    },
  });

  // GET /auctions/analytics - Get auction analytics (ADMIN only)
  fastify.get('/analytics', {
    preValidation: [fastify.authenticate, fastify.requireAdmin],
    handler: async (request, reply) => {
      return auctionsController.getAuctionAnalytics(request, reply);
    },
  });
};

export default auctionsRoutes;

