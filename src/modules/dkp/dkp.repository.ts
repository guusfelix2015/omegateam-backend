import type { PrismaClient, DkpTransaction } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { NotFoundError } from '@/libs/errors.ts';
import type {
  DkpTransactionWithRelations,
  CreateDkpTransactionData,
  GetDkpHistoryOptions,
  GetDkpLeaderboardOptions,
  DkpLeaderboardEntry,
} from './dkp.types.ts';



export class DkpRepository {
  constructor(private prisma: PrismaClient) { }

  async createTransaction(data: CreateDkpTransactionData): Promise<DkpTransaction> {
    return this.prisma.$transaction(async (tx) => {
      // Create the transaction record
      const transaction = await tx.dkpTransaction.create({
        data,
      });

      // Update user's DKP balance
      await tx.user.update({
        where: { id: data.userId },
        data: {
          dkpPoints: {
            increment: data.amount,
          },
        },
      });

      return transaction;
    });
  }

  async getUserDkpHistory(
    userId: string,
    options: Partial<GetDkpHistoryOptions> = {}
  ): Promise<{ data: DkpTransactionWithRelations[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      type,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.DkpTransactionWhereInput = {
      userId,
    };

    if (type) {
      where.type = type;
    }

    if (dateFrom ?? dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    // Execute queries in parallel
    const [transactionsResult, total] = await Promise.all([
      this.prisma.dkpTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              nickname: true,
              avatar: true,
            },
          },
          raidInstance: {
            select: {
              id: true,
              completedAt: true,
              raid: {
                select: {
                  id: true,
                  name: true,
                  bossLevel: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.dkpTransaction.count({ where }),
    ]);

    const transactions = transactionsResult as unknown as DkpTransactionWithRelations[];

    // Get created by user info for each transaction
    const transactionsWithCreatedBy = await Promise.all(
      transactions.map(async (transaction) => {
        const createdByUser = await this.prisma.user.findUnique({
          where: { id: transaction.createdBy },
          select: {
            id: true,
            name: true,
            nickname: true,
          },
        });

        if (!createdByUser) {
          throw new NotFoundError('Created by user not found');
        }

        return {
          ...transaction,
          createdByUser,
        };
      })
    );

    return {
      data: transactionsWithCreatedBy as DkpTransactionWithRelations[],
      total: total,
    };
  }

  async getDkpLeaderboard(
    options: Partial<GetDkpLeaderboardOptions> = {}
  ): Promise<{ data: DkpLeaderboardEntry[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      sortOrder = 'desc',
      search,
    } = options;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.UserWhereInput = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          nickname: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Execute queries in parallel
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          dkpPoints: sortOrder,
        },
        select: {
          id: true,
          name: true,
          nickname: true,
          avatar: true,
          dkpPoints: true,
          gearScore: true,
          lvl: true,
          classe: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      total,
    };
  }

  async getUserDkpSummary(userId: string): Promise<{
    userId: string;
    currentDkpPoints: number;
    totalEarned: number;
    totalSpent: number;
    totalRaidRewards: number;
    totalManualAdjustments: number;
    raidParticipations: number;
    lastActivity: Date | null;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { dkpPoints: true },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    const [
      totalEarnedResult,
      totalSpentResult,
      totalRaidRewardsResult,
      totalManualAdjustmentsResult,
      raidParticipations,
      lastActivity,
    ] = await Promise.all([
      this.prisma.dkpTransaction.aggregate({
        where: {
          userId,
          amount: { gt: 0 },
        },
        _sum: { amount: true },
      }),
      this.prisma.dkpTransaction.aggregate({
        where: {
          userId,
          amount: { lt: 0 },
        },
        _sum: { amount: true },
      }),
      this.prisma.dkpTransaction.aggregate({
        where: {
          userId,
          type: 'RAID_REWARD',
        },
        _sum: { amount: true },
      }),
      this.prisma.dkpTransaction.aggregate({
        where: {
          userId,
          type: 'MANUAL_ADJUSTMENT',
        },
        _sum: { amount: true },
      }),
      this.prisma.raidParticipant.count({
        where: { userId },
      }),
      this.prisma.dkpTransaction.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);

    const totalEarned = totalEarnedResult as { _sum: { amount: number | null } };
    const totalSpent = totalSpentResult as { _sum: { amount: number | null } };
    const totalRaidRewards = totalRaidRewardsResult as { _sum: { amount: number | null } };
    const totalManualAdjustments = totalManualAdjustmentsResult as { _sum: { amount: number | null } };

    return {
      userId,
      currentDkpPoints: user.dkpPoints,
      totalEarned: totalEarned._sum.amount ?? 0,
      totalSpent: Math.abs(totalSpent._sum.amount ?? 0),
      totalRaidRewards: totalRaidRewards._sum.amount ?? 0,
      totalManualAdjustments: totalManualAdjustments._sum.amount ?? 0,
      raidParticipations: raidParticipations,
      lastActivity: (lastActivity as { createdAt: Date } | null)?.createdAt ?? null,
    };
  }

  async getDkpStats(): Promise<{
    totalTransactions: number;
    totalDkpAwarded: number;
    totalDkpSpent: number;
    totalManualAdjustments: number;
    averageDkpPerUser: number;
    topDkpHolder: {
      id: string;
      name: string;
      nickname: string;
      dkpPoints: number;
    } | null;
  }> {
    const [
      totalTransactions,
      totalAwardedResult,
      totalSpentResult,
      manualAdjustments,
      averageDkpResult,
      topHolder,
    ] = await Promise.all([
      this.prisma.dkpTransaction.count(),
      this.prisma.dkpTransaction.aggregate({
        where: { amount: { gt: 0 } },
        _sum: { amount: true },
      }),
      this.prisma.dkpTransaction.aggregate({
        where: { amount: { lt: 0 } },
        _sum: { amount: true },
      }),
      this.prisma.dkpTransaction.count({
        where: { type: 'MANUAL_ADJUSTMENT' },
      }),
      this.prisma.user.aggregate({
        where: { isActive: true },
        _avg: { dkpPoints: true },
      }),
      this.prisma.user.findFirst({
        where: { isActive: true },
        orderBy: { dkpPoints: 'desc' },
        select: {
          id: true,
          name: true,
          nickname: true,
          dkpPoints: true,
        },
      }),
    ]);

    const totalAwarded = totalAwardedResult as { _sum: { amount: number | null } };
    const totalSpent = totalSpentResult as { _sum: { amount: number | null } };
    const averageDkp = averageDkpResult as { _avg: { dkpPoints: number | null } };

    return {
      totalTransactions: totalTransactions,
      totalDkpAwarded: totalAwarded._sum.amount ?? 0,
      totalDkpSpent: Math.abs(totalSpent._sum.amount ?? 0),
      totalManualAdjustments: manualAdjustments,
      averageDkpPerUser: Math.round(averageDkp._avg.dkpPoints ?? 0),
      topDkpHolder: topHolder as {
        id: string;
        name: string;
        nickname: string;
        dkpPoints: number;
      } | null,
    };
  }
}
