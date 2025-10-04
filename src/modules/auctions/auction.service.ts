import { NotFoundError, UnauthorizedError, ValidationError } from '@/libs/errors.ts';
import type { AuctionRepository } from './auction.repository.ts';
import { calculateTimeRemaining } from './auction.repository.ts';
import type { DkpRepository } from '../dkp/dkp.repository.ts';
import type { UserRepository } from '../users/user.repository.ts';
import type {
  AuctionWithRelations,
  CreateAuctionData,
  CreateBidData,

  GetAuctionsOptions,
  GetWonItemsOptions,
  UserWonItem,
} from './auction.types.ts';

export class AuctionService {
  constructor(
    private auctionRepository: AuctionRepository,
    private dkpRepository: DkpRepository,
    private userRepository: UserRepository
  ) { }

  // Create auction (ADMIN only)
  async createAuction(data: CreateAuctionData): Promise<AuctionWithRelations> {
    // Validate that all items exist and haven't been auctioned
    if (!data.itemIds || data.itemIds.length === 0) {
      throw new Error('At least one item must be selected');
    }

    const auction = await this.auctionRepository.createAuction(data);
    return this.auctionRepository.getAuctionById(auction.id);
  }

  // Start auction (ADMIN only)
  async startAuction(auctionId: string, adminId: string): Promise<AuctionWithRelations> {
    const auction = await this.auctionRepository.getAuctionById(auctionId);

    if (auction.createdBy !== adminId) {
      throw new UnauthorizedError('Only the auction creator can start it');
    }

    if (auction.status !== 'PENDING') {
      throw new ValidationError('Auction must be in PENDING status to start');
    }

    if (auction.items.length === 0) {
      throw new ValidationError('Auction must have at least one item');
    }

    // Update auction status to ACTIVE
    await this.auctionRepository.updateAuction(auctionId, {
      status: 'ACTIVE',
      startedAt: new Date(),
    });

    // Mark all items as auctioned
    const itemIds = auction.items.map((item) => item.raidDroppedItemId);
    await this.auctionRepository.markItemsAsAuctioned(itemIds);

    // Start the first item
    const firstItem = auction.items[0];
    if (firstItem) {
      await this.auctionRepository.updateAuctionItem(firstItem.id, {
        status: 'IN_AUCTION',
        timeRemaining: auction.defaultTimerSeconds,
        startedAt: new Date(),
      });
    }

    return this.auctionRepository.getAuctionById(auctionId);
  }

  // Place bid
  async placeBid(data: CreateBidData): Promise<AuctionWithRelations> {
    const auctionItem = await this.auctionRepository.getAuctionItemById(data.auctionItemId);

    // Validate auction item status
    if (auctionItem.status !== 'IN_AUCTION') {
      throw new ValidationError('This item is not currently in auction');
    }

    // Get user's DKP balance
    const user = await this.userRepository.findById(data.userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (!user.isActive) {
      throw new ValidationError('User is not active');
    }

    // Validate bid amount
    const minBidAmount = auctionItem.currentBid
      ? auctionItem.currentBid + 1 // Minimum increment is 1 DKP
      : auctionItem.minBid;

    if (data.amount < minBidAmount) {
      throw new ValidationError(
        `Bid must be at least ${minBidAmount} DKP`
      );
    }

    if (data.amount > user.dkpPoints) {
      throw new ValidationError(
        `Insufficient DKP. You have ${user.dkpPoints} DKP`
      );
    }

    // Mark previous bids as OUTBID
    if (auctionItem.bids.length > 0) {
      const activeBids = auctionItem.bids.filter((bid) => bid.status === 'ACTIVE');
      if (activeBids.length > 0) {
        await this.auctionRepository.updateBidsStatus(
          activeBids.map((bid) => bid.id),
          'OUTBID'
        );
      }
    }

    // Create new bid
    await this.auctionRepository.createBid(data);

    console.log(`[BID] 🔨 New bid placed: ${data.amount} DKP by user ${data.userId.slice(-8)} on item ${auctionItem.id.slice(-8)} - Timer RESET`);

    // Update auction item with new current bid
    // RESET timer by updating startedAt to NOW (common auction behavior)
    await this.auctionRepository.updateAuctionItem(auctionItem.id, {
      currentBid: data.amount,
      currentWinnerId: data.userId,
      startedAt: new Date(), // Reset timer when bid is placed
    });

    // Get the auction to return
    const auction = await this.auctionRepository.getAuctionById(auctionItem.auctionId);
    return auction;
  }

  // Finalize auction item (called when timer reaches 0)
  async finalizeAuctionItem(auctionItemId: string): Promise<void> {
    console.log(`[FINALIZE] Starting finalization for item ${auctionItemId.slice(-8)}`);

    const auctionItem = await this.auctionRepository.getAuctionItemById(auctionItemId);

    if (auctionItem.status !== 'IN_AUCTION') {
      console.log(`[FINALIZE] ⚠️ Item ${auctionItemId.slice(-8)} is not IN_AUCTION (status: ${auctionItem.status})`);
      throw new ValidationError('Item is not in auction');
    }

    const auction = await this.auctionRepository.getAuctionById(auctionItem.auctionId);

    // Check if there are bids
    if (auctionItem.currentBid && auctionItem.currentWinnerId) {
      console.log(`[FINALIZE] 💰 Item ${auctionItemId.slice(-8)} SOLD for ${auctionItem.currentBid} DKP to user ${auctionItem.currentWinnerId.slice(-8)}`);

      // Item sold - debit DKP
      await this.auctionRepository.updateAuctionItem(auctionItemId, {
        status: 'SOLD',
        finishedAt: new Date(),
      });

      // Mark winning bid as WON
      const winningBid = auctionItem.bids.find(
        (bid) => bid.userId === auctionItem.currentWinnerId && bid.status === 'ACTIVE'
      );
      if (winningBid) {
        await this.auctionRepository.updateBidStatus(winningBid.id, 'WON');
      }

      // Create DKP transaction (debit)
      await this.dkpRepository.createTransaction({
        userId: auctionItem.currentWinnerId,
        type: 'ITEM_PURCHASE',
        amount: -auctionItem.currentBid,
        reason: `Auction - ${auctionItem.raidDroppedItem.name} - Auction #${auction.id.slice(-8)}`,
        createdBy: auction.createdBy,
        auctionItemId: auctionItemId,
      });
    } else {
      console.log(`[FINALIZE] ❌ Item ${auctionItemId.slice(-8)} had NO_BIDS`);

      // No bids - mark as NO_BIDS
      await this.auctionRepository.updateAuctionItem(auctionItemId, {
        status: 'NO_BIDS',
        finishedAt: new Date(),
      });
    }

    // Check if there are more items to auction
    const nextItem = auction.items.find((item) => item.status === 'WAITING');

    if (nextItem) {
      console.log(`[FINALIZE] ➡️ Starting next item ${nextItem.id.slice(-8)}`);

      // Start next item
      await this.auctionRepository.updateAuctionItem(nextItem.id, {
        status: 'IN_AUCTION',
        timeRemaining: auction.defaultTimerSeconds,
        startedAt: new Date(),
      });
    } else {
      console.log(`[FINALIZE] 🏁 All items done - Finishing auction ${auction.id.slice(-8)}`);

      // All items done - finish auction
      await this.auctionRepository.updateAuction(auction.id, {
        status: 'FINISHED',
        finishedAt: new Date(),
      });
    }
  }

  // Get auction by ID
  async getAuctionById(id: string): Promise<AuctionWithRelations> {
    return this.auctionRepository.getAuctionById(id);
  }

  // Get auctions with pagination
  async getAuctions(
    options: Partial<GetAuctionsOptions> = {}
  ): Promise<{ data: AuctionWithRelations[]; total: number; page: number; limit: number }> {
    const result = await this.auctionRepository.getAuctions(options);
    return {
      ...result,
      page: options.page || 1,
      limit: options.limit || 10,
    };
  }

  // Get active auction
  async getActiveAuction(): Promise<AuctionWithRelations | null> {
    const result = await this.auctionRepository.getAuctions({
      page: 1,
      limit: 1,
      status: 'ACTIVE',
      sortBy: 'startedAt',
      sortOrder: 'desc',
    });

    const auction = result.data[0] || null;

    if (!auction) return null;

    // Calculate timeRemaining dynamically for each item
    const itemsWithCalculatedTimer = auction.items.map(item => ({
      ...item,
      timeRemaining: item.status === 'IN_AUCTION'
        ? calculateTimeRemaining(item.startedAt, auction.defaultTimerSeconds)
        : item.timeRemaining, // Keep original value for non-active items
    }));

    return {
      ...auction,
      items: itemsWithCalculatedTimer,
    };
  }

  // Get user's won items
  async getUserWonItems(userId: string, options: Partial<GetWonItemsOptions> = {}): Promise<UserWonItem[]> {
    return this.auctionRepository.getUserWonItems(userId, options);
  }

  // Cancel auction (ADMIN only)
  async cancelAuction(auctionId: string, adminId: string): Promise<AuctionWithRelations> {
    const auction = await this.auctionRepository.getAuctionById(auctionId);

    if (auction.createdBy !== adminId) {
      throw new UnauthorizedError('Only the auction creator can cancel it');
    }

    if (auction.status === 'FINISHED') {
      throw new ValidationError('Cannot cancel a finished auction');
    }

    // Update auction status
    await this.auctionRepository.updateAuction(auctionId, {
      status: 'CANCELLED',
      finishedAt: new Date(),
    });

    // Cancel all active bids
    const allBids = auction.items.flatMap((item) => item.bids);
    const activeBids = allBids.filter((bid) => bid.status === 'ACTIVE');
    if (activeBids.length > 0) {
      await this.auctionRepository.updateBidsStatus(
        activeBids.map((bid) => bid.id),
        'CANCELLED'
      );
    }

    // Update all items to CANCELLED
    for (const item of auction.items) {
      if (item.status !== 'SOLD' && item.status !== 'NO_BIDS') {
        await this.auctionRepository.updateAuctionItem(item.id, {
          status: 'CANCELLED',
        });
      }
    }

    // If auction was PENDING, reset hasBeenAuctioned flag
    if (auction.status === 'PENDING') {
      // Note: Items remain marked as auctioned for audit purposes
      // ADMIN can manually reset via the reset flag endpoint if needed
    }

    return this.auctionRepository.getAuctionById(auctionId);
  }

  // Update timer (called by polling mechanism) - DEPRECATED
  async updateTimer(auctionItemId: string, timeRemaining: number): Promise<void> {
    if (timeRemaining <= 0) {
      // Timer reached 0 - finalize item
      await this.finalizeAuctionItem(auctionItemId);
    } else {
      // Update time remaining
      await this.auctionRepository.updateAuctionItem(auctionItemId, {
        timeRemaining,
      });
    }
  }

  // Check for expired timers (called by cron job)
  async checkExpiredTimers(): Promise<void> {
    try {
      const auction = await this.getActiveAuction();
      if (!auction) {
        // No active auction - this is normal
        return;
      }

      const currentItem = auction.items.find(i => i.status === 'IN_AUCTION');
      if (!currentItem) {
        // No item in auction - this is normal (between items)
        return;
      }

      // Check if startedAt exists
      if (!currentItem.startedAt) {
        console.error(`[AUCTION TIMER] ⚠️ Item ${currentItem.id.slice(-8)} has no startedAt timestamp!`);
        return;
      }

      const timeRemaining = calculateTimeRemaining(
        currentItem.startedAt,
        auction.defaultTimerSeconds
      );

      // Log timer status for debugging (last 5 seconds)
      if (timeRemaining !== null && timeRemaining <= 5 && timeRemaining > 0) {
        console.log(`[AUCTION TIMER] Item ${currentItem.id.slice(-8)} - Time remaining: ${timeRemaining}s`);
      }

      // Check if timer expired
      if (timeRemaining !== null && timeRemaining <= 0) {
        console.log(`[AUCTION TIMER] ⏰ Timer expired for item ${currentItem.id.slice(-8)} - Finalizing...`);
        console.log(`[AUCTION TIMER] Item details: startedAt=${currentItem.startedAt}, defaultTimer=${auction.defaultTimerSeconds}s`);

        try {
          await this.finalizeAuctionItem(currentItem.id);
          console.log(`[AUCTION TIMER] ✅ Item ${currentItem.id.slice(-8)} finalized successfully`);
        } catch (error) {
          console.error(`[AUCTION TIMER] ❌ Error finalizing item ${currentItem.id.slice(-8)}:`, error);
          // Don't throw - let cron continue
        }
      }
    } catch (error) {
      console.error('[AUCTION TIMER] ❌ Error in checkExpiredTimers:', error);
      // Don't throw - let cron continue
    }
  }

  // Get auctioned items
  async getAuctionedItems(): Promise<any[]> {
    return this.auctionRepository.getAuctionedItems();
  }

  // Reset auctioned flag (ADMIN only)
  async resetAuctionedFlag(itemId: string, adminId: string, reason?: string): Promise<void> {
    await this.auctionRepository.resetAuctionedFlag(itemId, adminId, reason);
  }

  // Get audit logs
  async getAuditLogs(entityId?: string): Promise<any[]> {
    return this.auctionRepository.getAuditLogs(entityId);
  }

  // Get auction analytics
  async getAuctionAnalytics(): Promise<any> {
    return this.auctionRepository.getAuctionAnalytics();
  }
}

