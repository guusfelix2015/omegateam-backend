import { z } from 'zod';

// User role enum
export const userRoleSchema = z.enum(['ADMIN', 'PLAYER', 'CP_LEADER']);

// Player type enum
export const playerTypeSchema = z.enum(['PVP', 'PVE']);

// Clan enum
export const clanSchema = z.enum(['CLA1', 'CLA2']);

// Company Party association schema
export const userCompanyPartySchema = z.object({
  id: z.string(),
  companyPartyId: z.string(),
  joinedAt: z.string().datetime(),
  companyParty: z.object({
    id: z.string(),
    name: z.string(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),
});

// Classe schema
export const classeSchema = z.object({
  id: z.string().cuid(),
  name: z.string(),
  createdAt: z.string().datetime(),
});

// Base user schema
export const userSchema = z.object({
  id: z.string().cuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  nickname: z.string().min(1).max(50),
  avatar: z.string().url().nullable(),
  isActive: z.boolean(),
  lastLoginAt: z.string().datetime().nullable().optional(),
  lvl: z.number().int().min(1).max(85),
  role: userRoleSchema,
  classeId: z.string().cuid().nullable(),
  playerType: playerTypeSchema.nullable().optional(),
  clan: clanSchema.nullable().optional(),
  ownedItemIds: z.array(z.string().cuid()).default([]),
  gearScore: z.number().int().min(0).default(0),
  dkpPoints: z.number().int().min(0).default(0),
  bagUrl: z.string().url().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  classe: classeSchema.nullable().optional(),
  companyParties: z.array(userCompanyPartySchema).optional(),
});

export const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  nickname: z
    .string()
    .min(1, 'Nickname is required')
    .max(50, 'Nickname too long')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Nickname can only contain letters, numbers, and underscores'
    ),
  avatar: z.string().url('Invalid avatar URL').optional(),
  isActive: z.boolean().default(true),
  lvl: z.number().int().min(1).max(85).default(1),
  role: userRoleSchema.default('PLAYER'),
  classeId: z
    .string()
    .cuid()
    .nullable()
    .optional()
    .transform(val => (val === '' ? null : val)),
});

// Public registration schema - for user self-registration
export const registerUserSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  nickname: z
    .string()
    .min(1, 'Nickname é obrigatório')
    .max(50, 'Nickname muito longo')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Nickname pode conter apenas letras, números e underscore'
    ),
  phone: z
    .string()
    .regex(
      /^\+\d{1,3}\d{8,14}$/,
      'Telefone deve estar no formato internacional (ex: +55XXXXXXXXXXX)'
    ),
  lvl: z.number().int().min(1, 'Nível deve ser no mínimo 1').max(85, 'Nível máximo é 85'),
  playerType: playerTypeSchema,
  classeId: z
    .string()
    .cuid()
    .nullable()
    .optional()
    .transform(val => (val === '' ? null : val)),
});

export const updateUserSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .optional(),
  nickname: z
    .string()
    .min(1, 'Nickname is required')
    .max(50, 'Nickname too long')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Nickname can only contain letters, numbers, and underscores'
    )
    .optional(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .optional(),
  avatar: z.string().url('Invalid avatar URL').nullable().optional(),
  isActive: z.boolean().optional(),
  lvl: z.number().int().min(1).max(85).optional(),
  role: userRoleSchema.optional(),
  classeId: z.string().cuid().nullable().optional(), // User can update their class
  playerType: playerTypeSchema.nullable().optional(),
  clan: clanSchema.nullable().optional(),
});

// Update profile schema (restricted fields for user self-update)
// Users cannot update: email, role, isActive
export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .optional(),
  nickname: z
    .string()
    .min(1, 'Nickname is required')
    .max(50, 'Nickname too long')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Nickname can only contain letters, numbers, and underscores'
    )
    .optional(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .optional(),
  avatar: z.string().url('Invalid avatar URL').nullable().optional(),
  lvl: z.number().int().min(1).max(85).optional(),
  classeId: z.string().cuid().nullable().optional(),
  playerType: playerTypeSchema.nullable().optional(),
  clan: clanSchema.nullable().optional(),
  bagUrl: z.string().url('Invalid bag URL').nullable().optional(),
});

// Query parameters schema
export const getUsersQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  role: userRoleSchema.optional(),
  sortBy: z
    .enum(['name', 'email', 'nickname', 'lvl', 'createdAt'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Route parameters schema
export const userParamsSchema = z.object({
  id: z.string().cuid('Invalid user ID format'),
});

// Response schemas
export const userResponseSchema = userSchema;

export const usersListResponseSchema = z.object({
  data: z.array(userResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
});

export const userCreatedResponseSchema = z.object({
  data: userResponseSchema,
  message: z.string(),
});

export const userUpdatedResponseSchema = z.object({
  data: userResponseSchema,
  message: z.string(),
});

export const userDeletedResponseSchema = z.object({
  message: z.string(),
});

// Error response schema
export const errorResponseSchema = z.object({
  error: z.object({
    message: z.string(),
    statusCode: z.number(),
    details: z.unknown().optional(),
  }),
});

// Item category and grade enums
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

// Item schema
export const itemSchema = z.object({
  id: z.string().cuid(),
  name: z.string(),
  category: itemCategorySchema,
  grade: itemGradeSchema,
  valorGsInt: z.number().int(),
  valorDkp: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// UserItem schema
export const userItemSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  itemId: z.string().cuid(),
  enhancementLevel: z.number().int().min(0).max(12),
  isRare: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// UserItem with item details
export const userItemWithDetailsSchema = z.object({
  id: z.string().cuid(),
  itemId: z.string().cuid(),
  enhancementLevel: z.number().int().min(0).max(12),
  isRare: z.boolean().default(false),
  item: itemSchema,
});

// Gear Score schemas
export const updateUserGearSchema = z.object({
  items: z.array(
    z.object({
      itemId: z.string().cuid(),
      enhancementLevel: z.number().int().min(0).max(12).default(0),
      isRare: z.boolean().default(false),
    })
  ),
});

export const userGearResponseSchema = z.object({
  gearScore: z.number().int().min(0),
  userItems: z.array(userItemWithDetailsSchema),
});

// Update item enhancement schema
export const updateItemEnhancementSchema = z.object({
  userItemId: z.string().cuid(),
  enhancementLevel: z.number().int().min(0).max(12),
  isRare: z.boolean().optional(),
});

// Type exports
export type UserRole = z.infer<typeof userRoleSchema>;
export type User = z.infer<typeof userSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type GetUsersQuery = z.infer<typeof getUsersQuerySchema>;
export type UserParams = z.infer<typeof userParamsSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
export type UsersListResponse = z.infer<typeof usersListResponseSchema>;
export type ItemCategory = z.infer<typeof itemCategorySchema>;
export type ItemGrade = z.infer<typeof itemGradeSchema>;
export type Item = z.infer<typeof itemSchema>;
export type UserItem = z.infer<typeof userItemSchema>;
export type UserItemWithDetails = z.infer<typeof userItemWithDetailsSchema>;
export type UpdateUserGearInput = z.infer<typeof updateUserGearSchema>;
export type UserGearResponse = z.infer<typeof userGearResponseSchema>;
export type UpdateItemEnhancementInput = z.infer<
  typeof updateItemEnhancementSchema
>;
