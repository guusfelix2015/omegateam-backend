import { z } from 'zod';

// Item category enum (matching Prisma schema)
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

// Item grade enum (matching Prisma schema)
export const itemGradeSchema = z.enum(['D', 'C', 'B', 'A', 'S']);

// Base raid dropped item schema
export const raidDroppedItemSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(100),
  category: itemCategorySchema,
  grade: itemGradeSchema,
  minDkpBid: z.number().int().min(0),
  raidInstanceId: z.string().cuid(),
  droppedAt: z.string().datetime(),
  createdBy: z.string().cuid(),
  notes: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Create raid dropped item input schema
export const createRaidDroppedItemSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  category: itemCategorySchema,
  grade: itemGradeSchema,
  minDkpBid: z.number().int().min(0, 'Lance mínimo deve ser não-negativo'),
  raidInstanceId: z.string().cuid('ID da instância de raid inválido'),
  notes: z.string().max(500, 'Notas muito longas').optional(),
});

// Update raid dropped item input schema
export const updateRaidDroppedItemSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo').optional(),
  category: itemCategorySchema.optional(),
  grade: itemGradeSchema.optional(),
  minDkpBid: z.number().int().min(0, 'Lance mínimo deve ser não-negativo').optional(),
  notes: z.string().max(500, 'Notas muito longas').optional(),
});

// Query parameters schema for raid dropped items
export const getRaidDroppedItemsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  raidInstanceId: z.string().cuid().optional(),
  category: itemCategorySchema.optional(),
  grade: itemGradeSchema.optional(),
  sortBy: z.enum(['droppedAt', 'name', 'minDkpBid']).default('droppedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Raid dropped item with relations schema
export const raidDroppedItemWithRelationsSchema = raidDroppedItemSchema.extend({
  raidInstance: z.object({
    id: z.string().cuid(),
    completedAt: z.string().datetime(),
    raid: z.object({
      id: z.string().cuid(),
      name: z.string(),
      bossLevel: z.number().int(),
    }),
  }).optional(),
});

// Raid dropped item response schema
export const raidDroppedItemResponseSchema = raidDroppedItemWithRelationsSchema;

// Raid dropped items list response schema
export const raidDroppedItemsListResponseSchema = z.object({
  data: z.array(raidDroppedItemResponseSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
});

// Route parameters schema
export const raidDroppedItemParamsSchema = z.object({
  id: z.string().cuid('ID do item dropado inválido'),
});

export const raidInstanceParamsSchema = z.object({
  raidInstanceId: z.string().cuid('ID da instância de raid inválido'),
});

// Stats response schema
export const raidDroppedItemStatsSchema = z.object({
  total: z.number().int(),
  totalByCategory: z.record(z.string(), z.number().int()),
  totalByGrade: z.record(z.string(), z.number().int()),
  averageMinDkpBid: z.number().int(),
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
export type CreateRaidDroppedItemInput = z.infer<typeof createRaidDroppedItemSchema>;
export type UpdateRaidDroppedItemInput = z.infer<typeof updateRaidDroppedItemSchema>;
export type GetRaidDroppedItemsQuery = z.infer<typeof getRaidDroppedItemsQuerySchema>;
export type RaidDroppedItemParams = z.infer<typeof raidDroppedItemParamsSchema>;
export type RaidInstanceParams = z.infer<typeof raidInstanceParamsSchema>;
export type RaidDroppedItemResponse = z.infer<typeof raidDroppedItemResponseSchema>;
export type RaidDroppedItemsListResponse = z.infer<typeof raidDroppedItemsListResponseSchema>;
export type RaidDroppedItemStats = z.infer<typeof raidDroppedItemStatsSchema>;
