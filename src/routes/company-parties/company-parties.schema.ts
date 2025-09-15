import { z } from 'zod';

export const createCompanyPartySchema = z.object({
  name: z
    .string()
    .min(3, 'Company Party name must be at least 3 characters')
    .max(50, 'Company Party name must be at most 50 characters')
    .regex(
      /^[a-zA-Z0-9\s\-_]+$/,
      'Company Party name can only contain letters, numbers, spaces, hyphens, and underscores'
    ),
  // Accept but ignore these fields for now (future features)
  description: z.string().optional(),
  maxMembers: z.number().optional(),
});

export const updateCompanyPartySchema = z.object({
  name: z
    .string()
    .min(3, 'Company Party name must be at least 3 characters')
    .max(50, 'Company Party name must be at most 50 characters')
    .regex(
      /^[a-zA-Z0-9\s\-_]+$/,
      'Company Party name can only contain letters, numbers, spaces, hyphens, and underscores'
    )
    .optional(),
});

export const getCompanyPartiesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
});

export const companyPartyParamsSchema = z.object({
  id: z.string().cuid('Invalid Company Party ID format'),
});

export const addPlayerSchema = z.object({
  userId: z.string().cuid('Invalid User ID format'),
});

export const playerParamsSchema = z.object({
  id: z.string().cuid('Invalid Company Party ID format'),
  playerId: z.string().cuid('Invalid Player ID format'),
});

export const userInCompanyPartySchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  nickname: z.string(),
  avatar: z.string().nullable(),
  lvl: z.number(),
  role: z.enum(['ADMIN', 'PLAYER', 'CP_LEADER']),
});

export const companyPartyUserSchema = z.object({
  id: z.string(),
  userId: z.string(),
  joinedAt: z.string(),
  user: userInCompanyPartySchema,
});

export const companyPartyResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  users: z.array(userInCompanyPartySchema),
});

export const companyPartyListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  playerCount: z.number(),
});

export const paginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
});

export const companyPartiesListResponseSchema = z.object({
  data: z.array(companyPartyListItemSchema),
  pagination: paginationSchema,
});

export const userCompanyPartySchema = z.object({
  id: z.string(),
  companyPartyId: z.string(),
  joinedAt: z.string(),
  companyParty: z.object({
    id: z.string(),
    name: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
});

export const errorResponseSchema = z.object({
  error: z.object({
    message: z.string(),
    statusCode: z.number(),
  }),
});

export type CreateCompanyPartyInput = z.infer<typeof createCompanyPartySchema>;
export type UpdateCompanyPartyInput = z.infer<typeof updateCompanyPartySchema>;
export type GetCompanyPartiesQuery = z.infer<
  typeof getCompanyPartiesQuerySchema
>;
export type CompanyPartyParams = z.infer<typeof companyPartyParamsSchema>;
export type AddPlayerInput = z.infer<typeof addPlayerSchema>;
export type PlayerParams = z.infer<typeof playerParamsSchema>;
export type CompanyPartyResponse = z.infer<typeof companyPartyResponseSchema>;
export type CompanyPartyListResponse = z.infer<
  typeof companyPartiesListResponseSchema
>;
export type UserCompanyPartyResponse = z.infer<typeof userCompanyPartySchema>;
