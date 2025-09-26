import { z } from 'zod';

// Item category enum
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

// Item grade enum
export const itemGradeSchema = z.enum(['D', 'C', 'B', 'A', 'S']);

// Base item schema
export const itemSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(100),
  category: itemCategorySchema,
  grade: itemGradeSchema,
  valorGsInt: z.number().int().min(0),
  valorDkp: z.number().int().min(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Create item input schema
export const createItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  category: itemCategorySchema,
  grade: itemGradeSchema,
  valorGsInt: z.number().int().min(0, 'Valor GS INT must be non-negative'),
  valorDkp: z.number().int().min(0, 'Valor DKP must be non-negative'),
});

// Update item input schema
export const updateItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
  category: itemCategorySchema.optional(),
  grade: itemGradeSchema.optional(),
  valorGsInt: z.number().int().min(0, 'Valor GS INT must be non-negative').optional(),
  valorDkp: z.number().int().min(0, 'Valor DKP must be non-negative').optional(),
});

// Query parameters schema
export const getItemsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  category: itemCategorySchema.optional(),
  grade: itemGradeSchema.optional(),
  sortBy: z
    .enum(['name', 'category', 'grade', 'valorGsInt', 'valorDkp', 'createdAt'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Route parameters schema
export const itemParamsSchema = z.object({
  id: z.string().cuid('Invalid item ID format'),
});

// Response schemas
export const itemResponseSchema = itemSchema;

export const itemsListResponseSchema = z.object({
  data: z.array(itemResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
});

export const itemCreatedResponseSchema = z.object({
  data: itemResponseSchema,
  message: z.string(),
});

export const itemUpdatedResponseSchema = z.object({
  data: itemResponseSchema,
  message: z.string(),
});

export const itemDeletedResponseSchema = z.object({
  message: z.string(),
});

// Lookup schemas
export const categoriesLookupSchema = z.object({
  data: z.array(itemCategorySchema),
});

export const gradesLookupSchema = z.object({
  data: z.array(itemGradeSchema),
});

export const lookupsResponseSchema = z.object({
  categories: z.array(itemCategorySchema),
  grades: z.array(itemGradeSchema),
});

// Item stats schema
export const itemStatsSchema = z.object({
  total: z.number(),
  byCategory: z.object({
    HELMET: z.number(),
    ARMOR: z.number(),
    PANTS: z.number(),
    BOOTS: z.number(),
    GLOVES: z.number(),
    NECKLACE: z.number(),
    EARRING: z.number(),
    RING: z.number(),
    SHIELD: z.number(),
    WEAPON: z.number(),
  }),
  byGrade: z.object({
    D: z.number(),
    C: z.number(),
    B: z.number(),
    A: z.number(),
    S: z.number(),
  }),
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
export type ItemCategory = z.infer<typeof itemCategorySchema>;
export type ItemGrade = z.infer<typeof itemGradeSchema>;
export type Item = z.infer<typeof itemSchema>;
export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type GetItemsQuery = z.infer<typeof getItemsQuerySchema>;
export type ItemParams = z.infer<typeof itemParamsSchema>;
export type ItemResponse = z.infer<typeof itemResponseSchema>;
export type ItemsListResponse = z.infer<typeof itemsListResponseSchema>;
export type ItemCreatedResponse = z.infer<typeof itemCreatedResponseSchema>;
export type ItemUpdatedResponse = z.infer<typeof itemUpdatedResponseSchema>;
export type ItemDeletedResponse = z.infer<typeof itemDeletedResponseSchema>;
export type CategoriesLookup = z.infer<typeof categoriesLookupSchema>;
export type GradesLookup = z.infer<typeof gradesLookupSchema>;
export type LookupsResponse = z.infer<typeof lookupsResponseSchema>;
export type ItemStats = z.infer<typeof itemStatsSchema>;
