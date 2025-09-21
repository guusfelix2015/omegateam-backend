import { z } from 'zod';

// DKP Transaction Type enum
export const dkpTransactionTypeSchema = z.enum([
  'RAID_REWARD',
  'MANUAL_ADJUSTMENT', 
  'ITEM_PURCHASE',
]);

// DKP Transaction schema
export const dkpTransactionSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  type: dkpTransactionTypeSchema,
  amount: z.number().int(),
  reason: z.string().min(1),
  createdBy: z.string().cuid(),
  raidInstanceId: z.string().cuid().nullable(),
  createdAt: z.string().datetime(),
});

// Manual DKP adjustment input schema
export const dkpAdjustmentSchema = z.object({
  userId: z.string().cuid('Invalid user ID'),
  amount: z.number().int().refine(val => val !== 0, 'Amount cannot be zero'),
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason too long'),
});

// DKP leaderboard query schema
export const dkpLeaderboardQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(), // Search by user name/nickname
});

// DKP history query schema
export const dkpHistoryQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  type: dkpTransactionTypeSchema.optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  sortBy: z.enum(['createdAt', 'amount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// User params schema
export const userParamsSchema = z.object({
  id: z.string().cuid('Invalid user ID format'),
});

// DKP transaction response schema
export const dkpTransactionResponseSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  type: dkpTransactionTypeSchema,
  amount: z.number().int(),
  reason: z.string(),
  createdBy: z.string().cuid(),
  raidInstanceId: z.string().cuid().nullable(),
  createdAt: z.string().datetime(),
  user: z.object({
    id: z.string().cuid(),
    name: z.string(),
    nickname: z.string(),
    avatar: z.string().nullable(),
  }).optional(),
  createdByUser: z.object({
    id: z.string().cuid(),
    name: z.string(),
    nickname: z.string(),
  }).optional(),
  raidInstance: z.object({
    id: z.string().cuid(),
    completedAt: z.string().datetime(),
    raid: z.object({
      id: z.string().cuid(),
      name: z.string(),
      bossLevel: z.number().int(),
    }),
  }).nullable().optional(),
});

// DKP leaderboard entry schema
export const dkpLeaderboardEntrySchema = z.object({
  id: z.string().cuid(),
  name: z.string(),
  nickname: z.string(),
  avatar: z.string().nullable(),
  dkpPoints: z.number().int(),
  gearScore: z.number().int(),
  lvl: z.number().int(),
  classe: z.object({
    id: z.string().cuid(),
    name: z.string(),
  }).nullable(),
});

// DKP leaderboard response schema
export const dkpLeaderboardResponseSchema = z.object({
  data: z.array(dkpLeaderboardEntrySchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
});

// DKP history response schema
export const dkpHistoryResponseSchema = z.object({
  data: z.array(dkpTransactionResponseSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
});

// DKP stats schema
export const dkpStatsSchema = z.object({
  totalTransactions: z.number().int(),
  totalDkpAwarded: z.number().int(),
  totalDkpSpent: z.number().int(),
  totalManualAdjustments: z.number().int(),
  averageDkpPerUser: z.number(),
  topDkpHolder: z.object({
    id: z.string().cuid(),
    name: z.string(),
    nickname: z.string(),
    dkpPoints: z.number().int(),
  }).nullable(),
});

// User DKP summary schema
export const userDkpSummarySchema = z.object({
  userId: z.string().cuid(),
  currentDkpPoints: z.number().int(),
  totalEarned: z.number().int(),
  totalSpent: z.number().int(),
  totalRaidRewards: z.number().int(),
  totalManualAdjustments: z.number().int(),
  raidParticipations: z.number().int(),
  lastActivity: z.string().datetime().nullable(),
});

// Error response schema
export const errorResponseSchema = z.object({
  error: z.object({
    message: z.string(),
    statusCode: z.number(),
    details: z.unknown().optional(),
  }),
});

// Type exports
export type DkpTransactionType = z.infer<typeof dkpTransactionTypeSchema>;
export type DkpTransactionSchema = z.infer<typeof dkpTransactionSchema>;
export type DkpAdjustmentInput = z.infer<typeof dkpAdjustmentSchema>;
export type DkpLeaderboardQuery = z.infer<typeof dkpLeaderboardQuerySchema>;
export type DkpHistoryQuery = z.infer<typeof dkpHistoryQuerySchema>;
export type UserParams = z.infer<typeof userParamsSchema>;
export type DkpTransactionResponse = z.infer<typeof dkpTransactionResponseSchema>;
export type DkpLeaderboardEntry = z.infer<typeof dkpLeaderboardEntrySchema>;
export type DkpLeaderboardResponse = z.infer<typeof dkpLeaderboardResponseSchema>;
export type DkpHistoryResponse = z.infer<typeof dkpHistoryResponseSchema>;
export type DkpStats = z.infer<typeof dkpStatsSchema>;
export type UserDkpSummary = z.infer<typeof userDkpSummarySchema>;
