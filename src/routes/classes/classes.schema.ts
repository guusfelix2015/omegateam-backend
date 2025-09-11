import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

// Base classe schema
export const classeSchema = z.object({
  id: z.string().cuid(),
  name: z.string(),
  createdAt: z.string().datetime(),
});

// Response schemas
export const classeResponseSchema = classeSchema;

export const classesListResponseSchema = z.object({
  data: z.array(classeResponseSchema),
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
export type Classe = z.infer<typeof classeSchema>;
export type ClasseResponse = z.infer<typeof classeResponseSchema>;
export type ClassesListResponse = z.infer<typeof classesListResponseSchema>;

// JSON Schema exports for OpenAPI
export const classeJsonSchema = zodToJsonSchema(classeResponseSchema, 'Classe');
export const classesListResponseJsonSchema = zodToJsonSchema(
  classesListResponseSchema,
  'ClassesListResponse'
);
export const errorResponseJsonSchema = zodToJsonSchema(
  errorResponseSchema,
  'ErrorResponse'
);
