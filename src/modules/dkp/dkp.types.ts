import type { DkpTransaction, DkpTransactionType } from '@prisma/client';

// Prisma aggregate result types
export interface PrismaAggregateSum {
  _sum: {
    amount: number | null;
  };
}

export interface PrismaAggregateAvg {
  _avg: {
    dkpPoints: number | null;
  };
}

export interface PrismaTransactionResult {
  id: string;
  userId: string;
  type: DkpTransactionType;
  amount: number;
  reason: string;
  createdBy: string;
  raidInstanceId: string | null;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    nickname: string;
    avatar: string | null;
  };
  raidInstance: {
    id: string;
    completedAt: Date;
    raid: {
      id: string;
      name: string;
      bossLevel: number;
    };
  } | null;
}

export interface DkpTransactionWithRelations extends DkpTransaction {
  user: {
    id: string;
    name: string;
    nickname: string;
    avatar: string | null;
  };
  createdByUser: {
    id: string;
    name: string;
    nickname: string;
  };
  raidInstance: {
    id: string;
    completedAt: Date;
    raid: {
      id: string;
      name: string;
      bossLevel: number;
    };
  } | null;
}

export interface CreateDkpTransactionData {
  userId: string;
  type: DkpTransactionType;
  amount: number;
  reason: string;
  createdBy: string;
  raidInstanceId?: string;
  auctionItemId?: string;
}

export interface GetDkpHistoryOptions {
  page: number;
  limit: number;
  type?: DkpTransactionType;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy: 'createdAt' | 'amount';
  sortOrder: 'asc' | 'desc';
}

export interface GetDkpLeaderboardOptions {
  page: number;
  limit: number;
  sortOrder: 'asc' | 'desc';
  search?: string;
}

export interface DkpLeaderboardEntry {
  id: string;
  name: string;
  nickname: string;
  avatar: string | null;
  dkpPoints: number;
  gearScore: number;
  lvl: number;
  classe: {
    id: string;
    name: string;
  } | null;
}

export interface UserDkpSummary {
  userId: string;
  currentDkpPoints: number;
  totalEarned: number;
  totalSpent: number;
  totalRaidRewards: number;
  totalManualAdjustments: number;
  raidParticipations: number;
  lastActivity: Date | null;
}

export interface DkpStats {
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
}

export interface DkpLeaderboardResponse {
  data: DkpLeaderboardEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface DkpHistoryResponse {
  data: DkpTransactionWithRelations[];
  total: number;
}

export interface DkpTransactionResponse {
  id: string;
  userId: string;
  type: DkpTransactionType;
  amount: number;
  reason: string;
  createdBy: string;
  raidInstanceId: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    nickname: string;
    avatar: string | null;
  };
  createdByUser: {
    id: string;
    name: string;
    nickname: string;
  };
  raidInstance: {
    id: string;
    completedAt: string;
    raid: {
      id: string;
      name: string;
      bossLevel: number;
    };
  } | null;
}

export interface DkpAdjustmentInput {
  userId: string;
  amount: number;
  reason: string;
}

export interface DkpLeaderboardQuery {
  page?: number;
  limit?: number;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface DkpHistoryQuery {
  page?: number;
  limit?: number;
  type?: DkpTransactionType;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'createdAt' | 'amount';
  sortOrder?: 'asc' | 'desc';
}
