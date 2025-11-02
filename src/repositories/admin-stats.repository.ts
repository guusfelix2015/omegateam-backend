import { PrismaClient, Clan, PlayerType, UserRole } from '@prisma/client';

export interface AdminOverviewStats {
  users: {
    total: number;
    active: number;
    inactive: number;
    newLast7Days: number;
    newLast30Days: number;
  };
  raids: {
    total: number;
    audited: number;
    pendingAudit: number;
    last7Days: number;
    last30Days: number;
  };
  auctions: {
    total: number;
    active: number;
    finished: number;
    totalItemsSold: number;
  };
  dkp: {
    totalInCirculation: number;
    totalDistributed: number;
    averagePerPlayer: number;
  };
}

export interface UserAnalyticsFilters {
  dateFrom?: Date;
  dateTo?: Date;
  clan?: Clan;
  playerType?: PlayerType;
  classId?: string;
  levelMin?: number;
  levelMax?: number;
}

export interface UserAnalytics {
  totalUsers: number;
  levelDistribution: {
    range: string;
    count: number;
  }[];
  classDistribution: {
    id: string;
    name: string;
    count: number;
    percentage: number;
  }[];
  playerTypeDistribution: {
    type: string;
    count: number;
    percentage: number;
  }[];
  clanDistribution: {
    clan: string;
    count: number;
    percentage: number;
  }[];
  roleDistribution: {
    role: string;
    count: number;
    percentage: number;
  }[];
  topPlayersByGearScore: {
    id: string;
    name: string;
    nickname: string;
    gearScore: number;
    className?: string;
  }[];
  topPlayersByDkp: {
    id: string;
    name: string;
    nickname: string;
    dkpPoints: number;
    className?: string;
  }[];
  averageGearScore: number;
  averageDkp: number;
  averageLevel: number;
}

export interface RaidAnalyticsFilters {
  dateFrom?: Date;
  dateTo?: Date;
  raidId?: string;
}

export interface RaidAnalytics {
  totalRaids: number;
  auditedRaids: number;
  pendingAuditRaids: number;
  totalParticipants: number;
  averageParticipantsPerRaid: number;
  totalDkpDistributed: number;
  averageDkpPerRaid: number;
  attendanceConfirmationRate: number;
  mostPopularRaids: {
    id: string;
    name: string;
    instanceCount: number;
    totalParticipants: number;
  }[];
  raidTrends: {
    date: string;
    count: number;
    participants: number;
    dkpDistributed: number;
  }[];
}

export interface DkpAnalyticsFilters {
  dateFrom?: Date;
  dateTo?: Date;
  userId?: string;
}

export interface DkpAnalytics {
  totalDkpInCirculation: number;
  totalTransactions: number;
  transactionsByType: {
    type: string;
    count: number;
    totalAmount: number;
  }[];
  dkpTrends: {
    date: string;
    totalAmount: number;
    transactionCount: number;
  }[];
  averageDkpPerPlayer: number;
  topDkpHolders: {
    id: string;
    name: string;
    nickname: string;
    dkpPoints: number;
    className?: string;
  }[];
  dkpDistributionHistogram: {
    range: string;
    count: number;
  }[];
}

export interface CompanyPartyStats {
  totalParties: number;
  totalMembers: number;
  averageMembersPerParty: number;
  parties: {
    id: string;
    name: string;
    memberCount: number;
    averageDkp: number;
    averageGearScore: number;
  }[];
}

export interface ActivityFeedItem {
  id: string;
  type: 'raid' | 'auction' | 'user' | 'dkp';
  title: string;
  description: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export class AdminStatsRepository {
  constructor(private prisma: PrismaClient) {}

  async getOverviewStats(): Promise<AdminOverviewStats> {
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [
      userStats,
      activeUsers,
      newUsers7Days,
      newUsers30Days,
      raidStats,
      audited,
      raids7Days,
      raids30Days,
      auctionStats,
      activeAuctions,
      finishedAuctions,
      soldItems,
      dkpStats,
      avgDkp,
    ] = await Promise.all([
      // User stats
      this.prisma.user.aggregate({
        _count: true,
      }),
      this.prisma.user.count({
        where: { isActive: true },
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      // Raid stats
      this.prisma.raidInstance.aggregate({
        _count: true,
      }),
      this.prisma.raidInstance.count({
        where: { isAudited: true },
      }),
      this.prisma.raidInstance.count({
        where: { completedAt: { gte: sevenDaysAgo } },
      }),
      this.prisma.raidInstance.count({
        where: { completedAt: { gte: thirtyDaysAgo } },
      }),
      // Auction stats
      this.prisma.auction.aggregate({
        _count: true,
      }),
      this.prisma.auction.count({
        where: { status: 'ACTIVE' },
      }),
      this.prisma.auction.count({
        where: { status: 'FINISHED' },
      }),
      this.prisma.auctionItem.count({
        where: { status: 'SOLD' },
      }),
      // DKP stats
      this.prisma.dkpTransaction.aggregate({
        _sum: { amount: true },
      }),
      this.prisma.user.aggregate({
        where: { isActive: true },
        _avg: { dkpPoints: true },
      }),
    ]);

    const totalUsers = userStats._count;
    const totalRaids = raidStats._count;
    const totalAuctions = auctionStats._count;

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        newLast7Days: newUsers7Days,
        newLast30Days: newUsers30Days,
      },
      raids: {
        total: totalRaids,
        audited: audited,
        pendingAudit: totalRaids - audited,
        last7Days: raids7Days,
        last30Days: raids30Days,
      },
      auctions: {
        total: totalAuctions,
        active: activeAuctions,
        finished: finishedAuctions,
        totalItemsSold: soldItems,
      },
      dkp: {
        totalInCirculation: dkpStats._sum.amount || 0,
        totalDistributed: dkpStats._sum.amount || 0,
        averagePerPlayer: avgDkp._avg.dkpPoints || 0,
      },
    };
    } catch (error) {
      console.error('Error in getOverviewStats:', error);
      throw new Error(`Failed to fetch overview stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUserAnalytics(filters: UserAnalyticsFilters): Promise<UserAnalytics> {
    const where: any = {};

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }
    if (filters.clan) where.clan = filters.clan;
    if (filters.playerType) where.playerType = filters.playerType;
    if (filters.classId) where.classeId = filters.classId;
    if (filters.levelMin || filters.levelMax) {
      where.lvl = {};
      if (filters.levelMin) where.lvl.gte = filters.levelMin;
      if (filters.levelMax) where.lvl.lte = filters.levelMax;
    }

    const [totalUsers, users, averages] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        include: {
          classe: true,
        },
      }),
      this.prisma.user.aggregate({
        where,
        _avg: {
          gearScore: true,
          dkpPoints: true,
          lvl: true,
        },
      }),
    ]);

    // Level distribution
    const levelRanges = [
      { range: '1-20', min: 1, max: 20 },
      { range: '21-40', min: 21, max: 40 },
      { range: '41-60', min: 41, max: 60 },
      { range: '61-80', min: 61, max: 80 },
      { range: '81-85', min: 81, max: 85 },
    ];

    const levelDistribution = levelRanges.map((range) => ({
      range: range.range,
      count: users.filter((u) => u.lvl >= range.min && u.lvl <= range.max).length,
    }));

    // Class distribution
    const classCounts = new Map<string, { id: string; name: string; count: number }>();
    users.forEach((user) => {
      if (user.classe) {
        const existing = classCounts.get(user.classe.id) || {
          id: user.classe.id,
          name: user.classe.name,
          count: 0,
        };
        existing.count++;
        classCounts.set(user.classe.id, existing);
      }
    });

    const classDistribution = Array.from(classCounts.values()).map((c) => ({
      ...c,
      percentage: totalUsers > 0 ? (c.count / totalUsers) * 100 : 0,
    }));

    // Player type distribution
    const playerTypeCounts = new Map<string, number>();
    users.forEach((user) => {
      if (user.playerType) {
        playerTypeCounts.set(user.playerType, (playerTypeCounts.get(user.playerType) || 0) + 1);
      }
    });

    const playerTypeDistribution = Array.from(playerTypeCounts.entries()).map(([type, count]) => ({
      type,
      count,
      percentage: totalUsers > 0 ? (count / totalUsers) * 100 : 0,
    }));

    // Clan distribution
    const clanCounts = new Map<string, number>();
    users.forEach((user) => {
      if (user.clan) {
        clanCounts.set(user.clan, (clanCounts.get(user.clan) || 0) + 1);
      }
    });

    const clanDistribution = Array.from(clanCounts.entries()).map(([clan, count]) => ({
      clan,
      count,
      percentage: totalUsers > 0 ? (count / totalUsers) * 100 : 0,
    }));

    // Role distribution
    const roleCounts = new Map<string, number>();
    users.forEach((user) => {
      roleCounts.set(user.role, (roleCounts.get(user.role) || 0) + 1);
    });

    const roleDistribution = Array.from(roleCounts.entries()).map(([role, count]) => ({
      role,
      count,
      percentage: totalUsers > 0 ? (count / totalUsers) * 100 : 0,
    }));

    // Top players
    const topByGearScore = users
      .sort((a, b) => b.gearScore - a.gearScore)
      .slice(0, 10)
      .map((u) => ({
        id: u.id,
        name: u.name,
        nickname: u.nickname,
        gearScore: u.gearScore,
        className: u.classe?.name,
      }));

    const topByDkp = users
      .sort((a, b) => b.dkpPoints - a.dkpPoints)
      .slice(0, 10)
      .map((u) => ({
        id: u.id,
        name: u.name,
        nickname: u.nickname,
        dkpPoints: u.dkpPoints,
        className: u.classe?.name,
      }));

    return {
      totalUsers,
      levelDistribution,
      classDistribution,
      playerTypeDistribution,
      clanDistribution,
      roleDistribution,
      topPlayersByGearScore: topByGearScore,
      topPlayersByDkp: topByDkp,
      averageGearScore: averages._avg.gearScore || 0,
      averageDkp: averages._avg.dkpPoints || 0,
      averageLevel: averages._avg.lvl || 0,
    };
  }

  async getRaidAnalytics(filters: RaidAnalyticsFilters): Promise<RaidAnalytics> {
    const where: any = {};

    if (filters.dateFrom || filters.dateTo) {
      where.completedAt = {};
      if (filters.dateFrom) where.completedAt.gte = filters.dateFrom;
      if (filters.dateTo) where.completedAt.lte = filters.dateTo;
    }
    if (filters.raidId) where.raidId = filters.raidId;

    const [raidInstances, stats, participantStats, confirmationStats] = await Promise.all([
      this.prisma.raidInstance.findMany({
        where,
        include: {
          raid: true,
          participants: true,
          attendanceConfirmations: true,
          dkpTransactions: true,
        },
        orderBy: { completedAt: 'desc' },
      }),
      this.prisma.raidInstance.aggregate({
        where,
        _count: true,
      }),
      this.prisma.raidParticipant.aggregate({
        where: {
          raidInstance: where,
        },
        _count: true,
        _sum: { dkpAwarded: true },
      }),
      this.prisma.raidAttendanceConfirmation.count({
        where: {
          raidInstance: where,
        },
      }),
    ]);

    const totalRaids = stats._count;
    const auditedRaids = raidInstances.filter((r) => r.isAudited).length;
    const totalParticipants = participantStats._count;
    const totalDkpDistributed = participantStats._sum.dkpAwarded || 0;

    // Most popular raids
    const raidCounts = new Map<
      string,
      { id: string; name: string; instanceCount: number; totalParticipants: number }
    >();

    raidInstances.forEach((instance) => {
      const existing = raidCounts.get(instance.raid.id) || {
        id: instance.raid.id,
        name: instance.raid.name,
        instanceCount: 0,
        totalParticipants: 0,
      };
      existing.instanceCount++;
      existing.totalParticipants += instance.participants.length;
      raidCounts.set(instance.raid.id, existing);
    });

    const mostPopularRaids = Array.from(raidCounts.values())
      .sort((a, b) => b.instanceCount - a.instanceCount)
      .slice(0, 5);

    // Raid trends - group by day
    const trendMap = new Map<string, { count: number; participants: number; dkpDistributed: number }>();

    raidInstances.forEach((instance) => {
      const date = instance.completedAt.toISOString().split('T')[0];
      const existing = trendMap.get(date) || { count: 0, participants: 0, dkpDistributed: 0 };
      existing.count++;
      existing.participants += instance.participants.length;
      existing.dkpDistributed += instance.dkpTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      trendMap.set(date, existing);
    });

    const raidTrends = Array.from(trendMap.entries())
      .map(([date, data]) => ({
        date,
        count: data.count,
        participants: data.participants,
        dkpDistributed: data.dkpDistributed,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalRaids,
      auditedRaids,
      pendingAuditRaids: totalRaids - auditedRaids,
      totalParticipants,
      averageParticipantsPerRaid: totalRaids > 0 ? totalParticipants / totalRaids : 0,
      totalDkpDistributed,
      averageDkpPerRaid: totalRaids > 0 ? totalDkpDistributed / totalRaids : 0,
      attendanceConfirmationRate:
        totalParticipants > 0 ? (confirmationStats / totalParticipants) * 100 : 0,
      mostPopularRaids,
      raidTrends,
    };
  }

  async getDkpAnalytics(filters: DkpAnalyticsFilters): Promise<DkpAnalytics> {
    const where: any = {};

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }
    if (filters.userId) where.userId = filters.userId;

    const [transactions, totalDkpCirculation, averageDkp, topHolders] = await Promise.all([
      this.prisma.dkpTransaction.findMany({
        where,
        include: {
          user: {
            include: {
              classe: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.aggregate({
        where: { isActive: true },
        _sum: { dkpPoints: true },
      }),
      this.prisma.user.aggregate({
        where: { isActive: true },
        _avg: { dkpPoints: true },
      }),
      this.prisma.user.findMany({
        where: { isActive: true },
        include: {
          classe: true,
        },
        orderBy: { dkpPoints: 'desc' },
        take: 10,
      }),
    ]);

    // Transactions by type
    const typeCounts = new Map<string, { count: number; totalAmount: number }>();
    transactions.forEach((tx) => {
      const existing = typeCounts.get(tx.type) || { count: 0, totalAmount: 0 };
      existing.count++;
      existing.totalAmount += tx.amount;
      typeCounts.set(tx.type, existing);
    });

    const transactionsByType = Array.from(typeCounts.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      totalAmount: data.totalAmount,
    }));

    // DKP trends - group by day
    const trendMap = new Map<string, { totalAmount: number; transactionCount: number }>();
    transactions.forEach((tx) => {
      const date = tx.createdAt.toISOString().split('T')[0];
      const existing = trendMap.get(date) || { totalAmount: 0, transactionCount: 0 };
      existing.totalAmount += tx.amount;
      existing.transactionCount++;
      trendMap.set(date, existing);
    });

    const dkpTrends = Array.from(trendMap.entries())
      .map(([date, data]) => ({
        date,
        totalAmount: data.totalAmount,
        transactionCount: data.transactionCount,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // DKP distribution histogram
    const dkpRanges = [
      { range: '0-100', min: 0, max: 100 },
      { range: '101-500', min: 101, max: 500 },
      { range: '501-1000', min: 501, max: 1000 },
      { range: '1001-2000', min: 1001, max: 2000 },
      { range: '2000+', min: 2001, max: Infinity },
    ];

    const allUsers = await this.prisma.user.findMany({
      where: { isActive: true },
      select: { dkpPoints: true },
    });

    const dkpDistributionHistogram = dkpRanges.map((range) => ({
      range: range.range,
      count: allUsers.filter((u) => u.dkpPoints >= range.min && u.dkpPoints <= range.max).length,
    }));

    return {
      totalDkpInCirculation: totalDkpCirculation._sum.dkpPoints || 0,
      totalTransactions: transactions.length,
      transactionsByType,
      dkpTrends,
      averageDkpPerPlayer: averageDkp._avg.dkpPoints || 0,
      topDkpHolders: topHolders.map((u) => ({
        id: u.id,
        name: u.name,
        nickname: u.nickname,
        dkpPoints: u.dkpPoints,
        className: u.classe?.name,
      })),
      dkpDistributionHistogram,
    };
  }

  async getCompanyPartyStats(): Promise<CompanyPartyStats> {
    const parties = await this.prisma.companyParty.findMany({
      include: {
        users: {
          include: {
            user: {
              select: {
                dkpPoints: true,
                gearScore: true,
              },
            },
          },
        },
      },
    });

    const totalMembers = parties.reduce((sum, party) => sum + party.users.length, 0);

    const partyStats = parties.map((party) => {
      const members = party.users;
      const avgDkp =
        members.length > 0
          ? members.reduce((sum, m) => sum + m.user.dkpPoints, 0) / members.length
          : 0;
      const avgGearScore =
        members.length > 0
          ? members.reduce((sum, m) => sum + m.user.gearScore, 0) / members.length
          : 0;

      return {
        id: party.id,
        name: party.name,
        memberCount: members.length,
        averageDkp: avgDkp,
        averageGearScore: avgGearScore,
      };
    });

    return {
      totalParties: parties.length,
      totalMembers,
      averageMembersPerParty: parties.length > 0 ? totalMembers / parties.length : 0,
      parties: partyStats,
    };
  }

  async getActivityFeed(limit: number = 20): Promise<ActivityFeedItem[]> {
    const [recentRaids, recentAuctions, recentUsers, recentDkpTransactions] = await Promise.all([
      this.prisma.raidInstance.findMany({
        take: 5,
        orderBy: { completedAt: 'desc' },
        include: {
          raid: true,
          participants: true,
        },
      }),
      this.prisma.auction.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
        },
      }),
      this.prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.dkpTransaction.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        where: {
          type: 'MANUAL_ADJUSTMENT',
        },
        include: {
          user: true,
        },
      }),
    ]);

    const activities: ActivityFeedItem[] = [];

    recentRaids.forEach((raid) => {
      activities.push({
        id: raid.id,
        type: 'raid',
        title: `Raid: ${raid.raid.name}`,
        description: `Completed with ${raid.participants.length} participants`,
        createdAt: raid.completedAt,
        metadata: {
          raidName: raid.raid.name,
          participants: raid.participants.length,
          isAudited: raid.isAudited,
        },
      });
    });

    recentAuctions.forEach((auction) => {
      activities.push({
        id: auction.id,
        type: 'auction',
        title: `Auction ${auction.status}`,
        description: `${auction.items.length} items`,
        createdAt: auction.createdAt,
        metadata: {
          status: auction.status,
          itemCount: auction.items.length,
        },
      });
    });

    recentUsers.forEach((user) => {
      activities.push({
        id: user.id,
        type: 'user',
        title: `New User: ${user.name}`,
        description: `${user.nickname} joined`,
        createdAt: user.createdAt,
        metadata: {
          nickname: user.nickname,
          role: user.role,
        },
      });
    });

    recentDkpTransactions.forEach((tx) => {
      activities.push({
        id: tx.id,
        type: 'dkp',
        title: `DKP Adjustment: ${tx.user.nickname}`,
        description: `${tx.amount > 0 ? '+' : ''}${tx.amount} DKP - ${tx.reason}`,
        createdAt: tx.createdAt,
        metadata: {
          amount: tx.amount,
          reason: tx.reason,
        },
      });
    });

    return activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);
  }
}
