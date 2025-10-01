/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import type { PrismaClient, Auction, AuctionItem, Bid, BidStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { NotFoundError } from '@/libs/errors.ts';
import type {
  AuctionWithRelations,
  AuctionItemWithRelations,
  CreateAuctionData,
  CreateBidData,
  UpdateAuctionData,
  UpdateAuctionItemData,
  GetAuctionsOptions,
  UserWonItem,
  GetWonItemsOptions,
} from './auction.types.ts';

// Types for raw SQL queries
interface CategoryStatsRow {
  category: string;
  count: bigint;
  totalDkp: bigint | null;
  averageDkp: number | null;
}

interface GradeStatsRow {
  grade: string;
  count: bigint;
  totalDkp: bigint | null;
  averageDkp: number | null;
}

interface TrendRow {
  date: Date;
  auctionsCount: bigint;
  itemsSold: bigint;
  totalDkp: bigint | null;
}

export class AuctionRepository {
  constructor(private prisma: PrismaClient) { }

  // Create auction with items
  async createAuction(data: CreateAuctionData): Promise<Auction> {
    const { itemIds, ...auctionData } = data;

    return this.prisma.$transaction(async (tx) => {
      // Create the auction
      const auction = await tx.auction.create({
        data: {
          createdBy: auctionData.createdBy,
          defaultTimerSeconds: auctionData.defaultTimerSeconds ?? 20,
          minBidIncrement: auctionData.minBidIncrement ?? 1,
          notes: auctionData.notes,
        },
      });

      // Create auction items for each dropped item
      await Promise.all(
        itemIds.map(async (itemId) => {
          const droppedItem = await tx.raidDroppedItem.findUnique({
            where: { id: itemId },
          });

          if (!droppedItem) {
            throw new NotFoundError(`Dropped item ${itemId} not found`);
          }

          if (droppedItem.hasBeenAuctioned) {
            throw new Error(`Item ${droppedItem.name} has already been auctioned`);
          }

          return tx.auctionItem.create({
            data: {
              auctionId: auction.id,
              raidDroppedItemId: itemId,
              minBid: droppedItem.minDkpBid,
              status: 'WAITING',
            },
          });
        })
      );

      return auction;
    });
  }

  // Get auction by ID with relations
  async getAuctionById(id: string): Promise<AuctionWithRelations> {
    const auction = await this.prisma.auction.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            nickname: true,
            avatar: true,
          },
        },
        items: {
          include: {
            raidDroppedItem: {
              include: {
                raidInstance: {
                  include: {
                    raid: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
            currentWinner: {
              select: {
                id: true,
                name: true,
                nickname: true,
                avatar: true,
              },
            },
            bids: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    nickname: true,
                    avatar: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!auction) {
      throw new NotFoundError('Auction not found');
    }

    return auction;
  }

  // Get auctions with pagination
  async getAuctions(
    options: Partial<GetAuctionsOptions> = {}
  ): Promise<{ data: AuctionWithRelations[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      status,
      createdBy,
      dateFrom,
      dateTo,
      itemName,
      itemCategory,
      itemGrade,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    const skip = (page - 1) * limit;

    const where: Prisma.AuctionWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (createdBy) {
      where.createdBy = createdBy;
    }

    // Date filters
    if (dateFrom ?? dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    // Item filters
    if (itemName ?? itemCategory ?? itemGrade) {
      const raidDroppedItemFilter: Prisma.RaidDroppedItemWhereInput = {};

      if (itemName) {
        raidDroppedItemFilter.name = {
          contains: itemName,
          mode: 'insensitive',
        };
      }

      if (itemCategory) {
        raidDroppedItemFilter.category = itemCategory as Prisma.EnumItemCategoryFilter;
      }

      if (itemGrade) {
        raidDroppedItemFilter.grade = itemGrade as Prisma.EnumItemGradeFilter;
      }

      where.items = {
        some: {
          raidDroppedItem: raidDroppedItemFilter,
        },
      };
    }

    const [auctions, total] = await Promise.all([
      this.prisma.auction.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              nickname: true,
              avatar: true,
            },
          },
          items: {
            include: {
              raidDroppedItem: {
                include: {
                  raidInstance: {
                    include: {
                      raid: {
                        select: {
                          id: true,
                          name: true,
                        },
                      },
                    },
                  },
                },
              },
              currentWinner: {
                select: {
                  id: true,
                  name: true,
                  nickname: true,
                  avatar: true,
                },
              },
              bids: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      nickname: true,
                      avatar: true,
                    },
                  },
                },
                orderBy: {
                  createdAt: 'desc',
                },
              },
            },
          },
        },
      }),
      this.prisma.auction.count({ where }),
    ]);

    return {
      data: auctions,
      total,
    };
  }

  // Update auction
  async updateAuction(id: string, data: UpdateAuctionData): Promise<Auction> {
    return await this.prisma.auction.update({
      where: { id },
      data,
    });
  }

  // Update auction item
  async updateAuctionItem(id: string, data: UpdateAuctionItemData): Promise<AuctionItem> {
    return await this.prisma.auctionItem.update({
      where: { id },
      data,
    });
  }

  // Create bid
  async createBid(data: CreateBidData): Promise<Bid> {
    return await this.prisma.bid.create({
      data: {
        auctionItemId: data.auctionItemId,
        userId: data.userId,
        amount: data.amount,
        status: 'ACTIVE',
      },
    });
  }

  // Get auction item by ID
  async getAuctionItemById(id: string): Promise<AuctionItemWithRelations> {
    const item = await this.prisma.auctionItem.findUnique({
      where: { id },
      include: {
        raidDroppedItem: {
          include: {
            raidInstance: {
              include: {
                raid: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        currentWinner: {
          select: {
            id: true,
            name: true,
            nickname: true,
            avatar: true,
          },
        },
        bids: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                nickname: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundError('Auction item not found');
    }

    return item;
  }

  // Get user's won items
  async getUserWonItems(userId: string, options: Partial<GetWonItemsOptions> = {}): Promise<UserWonItem[]> {
    const { dateFrom, dateTo, itemCategory, itemGrade } = options;

    const where: Prisma.AuctionItemWhereInput = {
      currentWinnerId: userId,
      status: 'SOLD',
    };

    // Date filters
    if (dateFrom ?? dateTo) {
      where.finishedAt = {};
      if (dateFrom) where.finishedAt.gte = dateFrom;
      if (dateTo) where.finishedAt.lte = dateTo;
    }

    // Item filters
    if (itemCategory ?? itemGrade) {
      const raidDroppedItemFilter: Prisma.RaidDroppedItemWhereInput = {};

      if (itemCategory) {
        raidDroppedItemFilter.category = itemCategory as Prisma.EnumItemCategoryFilter;
      }

      if (itemGrade) {
        raidDroppedItemFilter.grade = itemGrade as Prisma.EnumItemGradeFilter;
      }

      where.raidDroppedItem = raidDroppedItemFilter;
    }

    const wonItems = await this.prisma.auctionItem.findMany({
      where,
      include: {
        raidDroppedItem: {
          include: {
            raidInstance: {
              include: {
                raid: true,
              },
            },
          },
        },
        auction: true,
      },
      orderBy: {
        finishedAt: 'desc',
      },
    });

    return wonItems.map((item) => ({
      id: item.id,
      itemName: item.raidDroppedItem.name,
      category: item.raidDroppedItem.category,
      grade: item.raidDroppedItem.grade,
      amountPaid: item.currentBid ?? 0,
      wonAt: item.finishedAt ?? new Date(),
      auctionId: item.auctionId,
      raidName: item.raidDroppedItem.raidInstance.raid.name,
      raidCompletedAt: item.raidDroppedItem.raidInstance.completedAt,
    }));
  }

  // Mark dropped items as auctioned
  async markItemsAsAuctioned(itemIds: string[]): Promise<void> {
    await this.prisma.raidDroppedItem.updateMany({
      where: {
        id: {
          in: itemIds,
        },
      },
      data: {
        hasBeenAuctioned: true,
      },
    });
  }

  // Update bid status
  async updateBidStatus(bidId: string, status: BidStatus): Promise<Bid> {
    return await this.prisma.bid.update({
      where: { id: bidId },
      data: { status },
    });
  }

  // Update multiple bids status
  async updateBidsStatus(bidIds: string[], status: BidStatus): Promise<void> {
    await this.prisma.bid.updateMany({
      where: {
        id: {
          in: bidIds,
        },
      },
      data: { status },
    });
  }

  // Get auctioned items (items with hasBeenAuctioned = true)
  async getAuctionedItems() {
    const items = await this.prisma.raidDroppedItem.findMany({
      where: {
        hasBeenAuctioned: true,
      },
      include: {
        raidInstance: {
          include: {
            raid: true,
          },
        },
        auctionItems: {
          include: {
            auction: true,
            currentWinner: {
              select: {
                id: true,
                name: true,
                nickname: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return items;
  }

  // Reset hasBeenAuctioned flag
  async resetAuctionedFlag(itemId: string, adminId: string, reason?: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Get current item state
      const item = await tx.raidDroppedItem.findUnique({
        where: { id: itemId },
      });

      if (!item) {
        throw new NotFoundError('Item not found');
      }

      // Update the flag
      await tx.raidDroppedItem.update({
        where: { id: itemId },
        data: { hasBeenAuctioned: false },
      });

      // Create audit log
      await tx.auctionAuditLog.create({
        data: {
          action: 'RESET_AUCTIONED_FLAG',
          entityType: 'RaidDroppedItem',
          entityId: itemId,
          performedBy: adminId,
          reason: reason ?? 'No reason provided',
          previousValue: JSON.stringify({ hasBeenAuctioned: true }),
          newValue: JSON.stringify({ hasBeenAuctioned: false }),
        },
      });
    });
  }

  // Get audit logs for an item
  async getAuditLogs(entityId?: string) {
    const where = entityId ? { entityId } : {};

    return await this.prisma.auctionAuditLog.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Get auction analytics
  async getAuctionAnalytics() {
    // Get basic stats
    const [totalAuctions, soldItems, noBidsItems] = await Promise.all([
      this.prisma.auction.count(),
      this.prisma.auctionItem.count({ where: { status: 'SOLD' } }),
      this.prisma.auctionItem.count({ where: { status: 'NO_BIDS' } }),
    ]);

    // Get total DKP spent and average
    const dkpStatsResult = await this.prisma.auctionItem.aggregate({
      where: { status: 'SOLD' },
      _sum: { currentBid: true },
      _avg: { currentBid: true },
    });

    const dkpStats = dkpStatsResult as { _sum: { currentBid: number | null }; _avg: { currentBid: number | null } };

    // Get average bids per item
    const bidsCount = await this.prisma.bid.count();
    const itemsWithBids = await this.prisma.auctionItem.count({
      where: {
        bids: {
          some: {},
        },
      },
    });

    // Get most popular items (by number of bids)
    // We need to get all auction items with their bid counts
    const allAuctionItems = await this.prisma.auctionItem.findMany({
      where: {
        bids: {
          some: {},
        },
      },
      select: {
        raidDroppedItemId: true,
        _count: {
          select: {
            bids: true,
          },
        },
      },
    });

    // Group by raidDroppedItemId and sum bid counts
    const itemBidCounts = new Map<string, number>();
    for (const item of allAuctionItems) {
      const currentCount = itemBidCounts.get(item.raidDroppedItemId) ?? 0;
      itemBidCounts.set(item.raidDroppedItemId, currentCount + item._count.bids);
    }

    // Sort and take top 10
    const popularItems = Array.from(itemBidCounts.entries())
      .map(([raidDroppedItemId, totalBids]) => ({
        raidDroppedItemId,
        _count: { bids: totalBids },
      }))
      .sort((a, b) => b._count.bids - a._count.bids)
      .slice(0, 10);

    // Get item details for popular items
    const popularItemsWithDetails = await Promise.all(
      popularItems.map(async (item) => {
        const itemDetails = await this.prisma.raidDroppedItem.findUnique({
          where: { id: item.raidDroppedItemId },
        });

        const itemAuctions = await this.prisma.auctionItem.findMany({
          where: {
            raidDroppedItemId: item.raidDroppedItemId,
            status: 'SOLD',
          },
        });

        const prices = itemAuctions.map((a) => a.currentBid ?? 0);
        const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
        const highestPrice = prices.length > 0 ? Math.max(...prices) : 0;

        return {
          itemName: itemDetails?.name ?? 'Unknown',
          category: itemDetails?.category ?? 'Unknown',
          grade: itemDetails?.grade ?? 'Unknown',
          totalBids: item._count.bids,
          totalAuctions: itemAuctions.length,
          averagePrice: Math.round(avgPrice),
          highestPrice,
        };
      })
    );

    // Get top spenders
    const topSpenders = await this.prisma.auctionItem.groupBy({
      by: ['currentWinnerId'],
      where: {
        status: 'SOLD',
        currentWinnerId: { not: null },
      },
      _sum: { currentBid: true },
      _count: { id: true },
      orderBy: {
        _sum: {
          currentBid: 'desc',
        },
      },
      take: 10,
    });

    const topSpendersWithDetails = await Promise.all(
      topSpenders.map(async (spender) => {
        if (!spender.currentWinnerId) {
          return {
            userId: '',
            userName: 'Unknown',
            userNickname: 'Unknown',
            totalSpent: 0,
            itemsWon: 0,
            averageSpent: 0,
          };
        }

        const user = await this.prisma.user.findUnique({
          where: { id: spender.currentWinnerId },
          select: { id: true, name: true, nickname: true },
        });

        return {
          userId: user?.id ?? '',
          userName: user?.name ?? 'Unknown',
          userNickname: user?.nickname ?? 'Unknown',
          totalSpent: spender._sum.currentBid ?? 0,
          itemsWon: spender._count.id,
          averageSpent: Math.round((spender._sum.currentBid ?? 0) / spender._count.id),
        };
      })
    );

    // Get category distribution
    const categoryStats = await this.prisma.$queryRaw<CategoryStatsRow[]>`
      SELECT
        rdi.category,
        COUNT(ai.id) as count,
        SUM(ai.current_bid) as "totalDkp",
        AVG(ai.current_bid) as "averageDkp"
      FROM auction_items ai
      JOIN raid_dropped_items rdi ON ai.raid_dropped_item_id = rdi.id
      WHERE ai.status = 'SOLD'
      GROUP BY rdi.category
      ORDER BY count DESC
    `;

    // Get grade distribution
    const gradeStats = await this.prisma.$queryRaw<GradeStatsRow[]>`
      SELECT
        rdi.grade,
        COUNT(ai.id) as count,
        SUM(ai.current_bid) as "totalDkp",
        AVG(ai.current_bid) as "averageDkp"
      FROM auction_items ai
      JOIN raid_dropped_items rdi ON ai.raid_dropped_item_id = rdi.id
      WHERE ai.status = 'SOLD'
      GROUP BY rdi.grade
      ORDER BY count DESC
    `;

    // Get auction trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trends = await this.prisma.$queryRaw<TrendRow[]>`
      SELECT
        DATE(a.created_at) as date,
        COUNT(DISTINCT a.id) as "auctionsCount",
        COUNT(CASE WHEN ai.status = 'SOLD' THEN 1 END) as "itemsSold",
        SUM(CASE WHEN ai.status = 'SOLD' THEN ai.current_bid ELSE 0 END) as "totalDkp"
      FROM auctions a
      LEFT JOIN auction_items ai ON ai.auction_id = a.id
      WHERE a.created_at >= ${thirtyDaysAgo}
      GROUP BY DATE(a.created_at)
      ORDER BY date DESC
    `;

    return {
      totalAuctions,
      totalItemsSold: soldItems,
      totalItemsNoBids: noBidsItems,
      totalDkpSpent: dkpStats._sum.currentBid ?? 0,
      averageDkpPerItem: Math.round(dkpStats._avg.currentBid ?? 0),
      averageBidsPerItem: itemsWithBids > 0 ? Math.round(bidsCount / itemsWithBids) : 0,
      mostPopularItems: popularItemsWithDetails,
      topSpenders: topSpendersWithDetails,
      categoryDistribution: categoryStats.map((stat) => ({
        category: String(stat.category),
        count: Number(stat.count),
        totalDkp: Number(stat.totalDkp ?? 0),
        averageDkp: Math.round(Number(stat.averageDkp ?? 0)),
      })),
      gradeDistribution: gradeStats.map((stat) => ({
        grade: String(stat.grade),
        count: Number(stat.count),
        totalDkp: Number(stat.totalDkp ?? 0),
        averageDkp: Math.round(Number(stat.averageDkp ?? 0)),
      })),
      auctionTrends: trends.map((trend) => ({
        date: String(trend.date).split('T')[0],
        auctionsCount: Number(trend.auctionsCount),
        itemsSold: Number(trend.itemsSold),
        totalDkp: Number(trend.totalDkp ?? 0),
      })),
    };
  }
}

