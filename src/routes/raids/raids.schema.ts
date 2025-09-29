import { z } from 'zod';

// DKP Transaction Type enum
export const dkpTransactionTypeSchema = z.enum([
  'RAID_REWARD',
  'MANUAL_ADJUSTMENT',
  'ITEM_PURCHASE',
]);

// Base raid schema
export const raidSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(100),
  bossLevel: z.number().int().min(1).max(100),
  baseScore: z.number().int().min(1),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Create raid input schema
export const createRaidSchema = z.object({
  name: z.string().min(1, 'Raid name is required').max(100, 'Raid name too long'),
  bossLevel: z.number().int().min(1, 'Boss level must be at least 1').max(100, 'Boss level too high'),
  baseScore: z.number().int().min(1, 'Base score must be at least 1'),
});

// Update raid input schema
export const updateRaidSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bossLevel: z.number().int().min(1).max(100).optional(),
  baseScore: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
});

// Query parameters schema for raids
export const getRaidsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  sortBy: z.enum(['name', 'bossLevel', 'baseScore', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Route parameters schema
export const raidParamsSchema = z.object({
  id: z.string().cuid('Invalid raid ID format'),
});

// Raid response schema
export const raidResponseSchema = z.object({
  id: z.string().cuid(),
  name: z.string(),
  bossLevel: z.number().int(),
  baseScore: z.number().int(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Raids list response schema
export const raidsListResponseSchema = z.object({
  data: z.array(raidResponseSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
});

// Raid instance schemas
export const raidInstanceSchema = z.object({
  id: z.string().cuid(),
  raidId: z.string().cuid(),
  completedAt: z.string().datetime(),
  createdBy: z.string().cuid(),
  notes: z.string().nullable(),
  createdAt: z.string().datetime(),
  raid: raidResponseSchema.optional(),
});

// Dropped item for raid instance creation
export const createRaidInstanceDroppedItemSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  category: z.enum(['WEAPON', 'ARMOR', 'ACCESSORY', 'CONSUMABLE', 'MISC']),
  grade: z.enum(['NO_GRADE', 'D', 'C', 'B', 'A', 'S']),
  minDkpBid: z.number().int().min(0, 'Lance mínimo deve ser não-negativo'),
  notes: z.string().max(500, 'Notas muito longas').optional(),
});

// Create raid instance input schema
export const createRaidInstanceSchema = z.object({
  raidId: z.string().cuid('Invalid raid ID'),
  participantIds: z.array(z.string().cuid()).min(1, 'At least one participant is required'),
  notes: z.string().max(500).optional(),
});

// Extended create raid instance input schema with dropped items
export const createRaidInstanceWithItemsSchema = z.object({
  raidId: z.string().cuid('Invalid raid ID'),
  participantIds: z.array(z.string().cuid()).min(1, 'At least one participant is required'),
  notes: z.string().max(500).optional(),
  droppedItems: z.array(createRaidInstanceDroppedItemSchema).optional(),
});

// Query parameters schema for raid instances
export const getRaidInstancesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  raidId: z.string().cuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  sortBy: z.enum(['completedAt', 'createdAt']).default('completedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Raid participant schema
export const raidParticipantSchema = z.object({
  id: z.string().cuid(),
  raidInstanceId: z.string().cuid(),
  userId: z.string().cuid(),
  gearScoreAtTime: z.number().int().min(0),
  dkpAwarded: z.number().int().min(0),
  createdAt: z.string().datetime(),
  user: z.object({
    id: z.string().cuid(),
    name: z.string(),
    nickname: z.string(),
    avatar: z.string().nullable(),
  }).optional(),
});

// Raid instance response schema
export const raidInstanceResponseSchema = z.object({
  id: z.string().cuid(),
  raidId: z.string().cuid(),
  completedAt: z.string().datetime(),
  createdBy: z.string().cuid(),
  notes: z.string().nullable(),
  createdAt: z.string().datetime(),
  raid: raidResponseSchema,
  participants: z.array(raidParticipantSchema),
});

// Raid instances list response schema
export const raidInstancesListResponseSchema = z.object({
  data: z.array(raidInstanceResponseSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
});

// Route parameters schema for raid instances
export const raidInstanceParamsSchema = z.object({
  id: z.string().cuid('Invalid raid instance ID format'),
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
export type RaidSchema = z.infer<typeof raidSchema>;
export type CreateRaidInput = z.infer<typeof createRaidSchema>;
export type UpdateRaidInput = z.infer<typeof updateRaidSchema>;
export type GetRaidsQuery = z.infer<typeof getRaidsQuerySchema>;
export type RaidParams = z.infer<typeof raidParamsSchema>;
export type RaidResponse = z.infer<typeof raidResponseSchema>;
export type RaidsListResponse = z.infer<typeof raidsListResponseSchema>;
export type RaidInstanceSchema = z.infer<typeof raidInstanceSchema>;
export type CreateRaidInstanceInput = z.infer<typeof createRaidInstanceSchema>;
export type CreateRaidInstanceWithItemsInput = z.infer<typeof createRaidInstanceWithItemsSchema>;
export type CreateRaidInstanceDroppedItemInput = z.infer<typeof createRaidInstanceDroppedItemSchema>;
export type GetRaidInstancesQuery = z.infer<typeof getRaidInstancesQuerySchema>;
export type RaidParticipantSchema = z.infer<typeof raidParticipantSchema>;
export type RaidInstanceResponse = z.infer<typeof raidInstanceResponseSchema>;
export type RaidInstancesListResponse = z.infer<typeof raidInstancesListResponseSchema>;
export type RaidInstanceParams = z.infer<typeof raidInstanceParamsSchema>;
