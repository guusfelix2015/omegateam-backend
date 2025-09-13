import { z } from 'zod';

export const classeSchema = z.object({
  id: z.string().cuid(),
  name: z.string(),
  createdAt: z.string().datetime(),
});

export const classeResponseSchema = classeSchema;

export const classesListResponseSchema = z.object({
  data: z.array(classeResponseSchema),
});

export const errorResponseSchema = z.object({
  error: z.object({
    message: z.string(),
    statusCode: z.number(),
    details: z.unknown().optional(),
  }),
});

export type Classe = z.infer<typeof classeSchema>;
export type ClasseResponse = z.infer<typeof classeResponseSchema>;
export type ClassesListResponse = z.infer<typeof classesListResponseSchema>;
