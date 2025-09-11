import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

// User role enum
export const userRoleSchema = z.enum(['ADMIN', 'PLAYER']);

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

// Base user schema
export const userSchema = z.object({
  id: z.string().cuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  nickname: z.string().min(1).max(50),
  avatar: z.string().url().nullable(),
  isActive: z.boolean(),
  lvl: z.number().int().min(1).max(85),
  role: userRoleSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  companyParties: z.array(userCompanyPartySchema).optional(),
});

// Create user schema (for ADMIN creating users)
export const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  nickname: z
    .string()
    .min(1, 'Nickname is required')
    .max(50, 'Nickname too long')
    .regex(/^[a-zA-Z0-9_]+$/, 'Nickname can only contain letters, numbers, and underscores'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters'),
  avatar: z.string().url('Invalid avatar URL').optional(),
  isActive: z.boolean().default(true),
  lvl: z.number().int().min(1).max(85).default(1),
  role: userRoleSchema,
});

// Update user schema
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
    .regex(/^[a-zA-Z0-9_]+$/, 'Nickname can only contain letters, numbers, and underscores')
    .optional(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .optional(),
  avatar: z.string().url('Invalid avatar URL').nullable().optional(),
  isActive: z.boolean().optional(),
  lvl: z.number().int().min(1).max(85).optional(),
  role: userRoleSchema.optional(),
});

// Query parameters schema
export const getUsersQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  role: userRoleSchema.optional(),
  sortBy: z.enum(['name', 'email', 'nickname', 'lvl', 'createdAt']).default('createdAt'),
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

// Type exports
export type UserRole = z.infer<typeof userRoleSchema>;
export type User = z.infer<typeof userSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type GetUsersQuery = z.infer<typeof getUsersQuerySchema>;
export type UserParams = z.infer<typeof userParamsSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
export type UsersListResponse = z.infer<typeof usersListResponseSchema>;

// JSON Schema exports for OpenAPI
export const userJsonSchema = zodToJsonSchema(userResponseSchema, 'User');
export const createUserJsonSchema = zodToJsonSchema(
  createUserSchema,
  'CreateUser'
);
export const updateUserJsonSchema = zodToJsonSchema(
  updateUserSchema,
  'UpdateUser'
);
export const getUsersQueryJsonSchema = zodToJsonSchema(
  getUsersQuerySchema,
  'GetUsersQuery'
);
export const usersListResponseJsonSchema = zodToJsonSchema(
  usersListResponseSchema,
  'UsersListResponse'
);
export const errorResponseJsonSchema = zodToJsonSchema(
  errorResponseSchema,
  'ErrorResponse'
);
