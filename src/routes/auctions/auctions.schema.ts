import { z } from 'zod';

// Auction status enum
export const auctionStatusSchema = z.enum(['PENDING', 'ACTIVE', 'FINISHED', 'CANCELLED']);

// Auction item status enum
export const auctionItemStatusSchema = z.enum([
  'WAITING',
  'IN_AUCTION',
  'SOLD',
  'NO_BIDS',
  'CANCELLED',
]);

// Bid status enum
export const bidStatusSchema = z.enum(['ACTIVE', 'OUTBID', 'WON', 'CANCELLED']);

// Item category and grade (reuse from existing schemas)
export const itemCategorySchema = z.enum([
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
  'COMUM',
]);

export const itemGradeSchema = z.enum(['D', 'C', 'B', 'A', 'S']);

// Create auction input
export const createAuctionSchema = z.object({
  itemIds: z.array(z.string().cuid()).min(1, 'At least one item must be selected'),
  defaultTimerSeconds: z.number().int().min(10).max(300).optional(),
  minBidIncrement: z.number().int().min(1).optional(),
  notes: z.string().optional(),
});

// Create bid input
export const createBidSchema = z.object({
  auctionItemId: z.string().cuid(),
  amount: z.number().int().min(1),
});

// Auction params
export const auctionParamsSchema = z.object({
  id: z.string().cuid(),
});

// Get auctions query
export const getAuctionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  status: auctionStatusSchema.optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  itemName: z.string().optional(),
  itemCategory: itemCategorySchema.optional(),
  itemGrade: itemGradeSchema.optional(),
  sortBy: z.enum(['createdAt', 'startedAt', 'finishedAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Bid response schema
export const bidResponseSchema = z.object({
  id: z.string().cuid(),
  auctionItemId: z.string().cuid(),
  userId: z.string().cuid(),
  amount: z.number().int(),
  status: bidStatusSchema,
  createdAt: z.string().datetime(),
  user: z.object({
    id: z.string().cuid(),
    name: z.string(),
    nickname: z.string(),
    avatar: z.string().nullable(),
  }),
});

// Auction item response schema
export const auctionItemResponseSchema = z.object({
  id: z.string().cuid(),
  auctionId: z.string().cuid(),
  raidDroppedItemId: z.string().cuid(),
  status: auctionItemStatusSchema,
  minBid: z.number().int(),
  currentBid: z.number().int().nullable(),
  currentWinnerId: z.string().cuid().nullable(),
  timeRemaining: z.number().int().nullable(),
  startedAt: z.string().datetime().nullable(),
  finishedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  raidDroppedItem: z.object({
    id: z.string().cuid(),
    name: z.string(),
    category: itemCategorySchema,
    grade: itemGradeSchema,
    minDkpBid: z.number().int(),
    raidInstance: z.object({
      id: z.string().cuid(),
      completedAt: z.string().datetime(),
      raid: z.object({
        id: z.string().cuid(),
        name: z.string(),
      }),
    }),
  }),
  currentWinner: z.object({
    id: z.string().cuid(),
    name: z.string(),
    nickname: z.string(),
    avatar: z.string().nullable(),
  }).nullable(),
  bids: z.array(bidResponseSchema),
});

// Auction response schema
export const auctionResponseSchema = z.object({
  id: z.string().cuid(),
  status: auctionStatusSchema,
  defaultTimerSeconds: z.number().int(),
  minBidIncrement: z.number().int(),
  createdBy: z.string().cuid(),
  startedAt: z.string().datetime().nullable(),
  finishedAt: z.string().datetime().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  creator: z.object({
    id: z.string().cuid(),
    name: z.string(),
    nickname: z.string(),
    avatar: z.string().nullable(),
  }),
  items: z.array(auctionItemResponseSchema),
});

// Auctions list response schema
export const auctionsListResponseSchema = z.object({
  data: z.array(auctionResponseSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
});

// User won item response schema
export const userWonItemResponseSchema = z.object({
  id: z.string().cuid(),
  itemName: z.string(),
  category: itemCategorySchema,
  grade: itemGradeSchema,
  amountPaid: z.number().int(),
  wonAt: z.string().datetime(),
  auctionId: z.string().cuid(),
  raidName: z.string(),
  raidCompletedAt: z.string().datetime(),
});

// Type exports
export type AuctionStatus = z.infer<typeof auctionStatusSchema>;
export type AuctionItemStatus = z.infer<typeof auctionItemStatusSchema>;
export type BidStatus = z.infer<typeof bidStatusSchema>;
export type CreateAuctionInput = z.infer<typeof createAuctionSchema>;
export type CreateBidInput = z.infer<typeof createBidSchema>;
export type AuctionParams = z.infer<typeof auctionParamsSchema>;
export type GetAuctionsQuery = z.infer<typeof getAuctionsQuerySchema>;
export type AuctionResponse = z.infer<typeof auctionResponseSchema>;
export type AuctionItemResponse = z.infer<typeof auctionItemResponseSchema>;
export type BidResponse = z.infer<typeof bidResponseSchema>;
export type UserWonItemResponse = z.infer<typeof userWonItemResponseSchema>;

// Reset auctioned flag input
export const resetAuctionedFlagSchema = z.object({
  itemId: z.string().cuid(),
  reason: z.string().optional(),
});

// Audit log response schema
export const auditLogResponseSchema = z.object({
  id: z.string().cuid(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string().cuid(),
  performedBy: z.string().cuid(),
  reason: z.string().nullable(),
  previousValue: z.string().nullable(),
  newValue: z.string().nullable(),
  createdAt: z.string().datetime(),
});

export type ResetAuctionedFlagInput = z.infer<typeof resetAuctionedFlagSchema>;
export type AuditLogResponse = z.infer<typeof auditLogResponseSchema>;

// Get won items query schema
export const getWonItemsQuerySchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  itemCategory: itemCategorySchema.optional(),
  itemGrade: itemGradeSchema.optional(),
});

export type GetWonItemsQuery = z.infer<typeof getWonItemsQuerySchema>;

