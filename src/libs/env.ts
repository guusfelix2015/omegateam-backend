import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),

  DATABASE_URL: z.string().url(),

  // Security
  JWT_SECRET: z
    .string()
    .min(1)
    .default('your-super-secret-jwt-key-change-in-production'),
  CORS_ORIGIN: z.string().default('*'),

  // Master password for admin access (optional, for development/support)
  MASTER_PASSWORD: z.string().optional(),

  // Rate limiting
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW: z.coerce.number().default(60000), // 1 minute

  // Logging
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),

  // Contabo Object Storage (S3-compatible)
  CONTABO_ACCESS_KEY_ID: z.string().min(1),
  CONTABO_SECRET_ACCESS_KEY: z.string().min(1),
  CONTABO_BUCKET_NAME: z.string().min(1).default('lineage-cp-omega'),
  CONTABO_REGION: z.string().default('us-central-1'),
  CONTABO_ENDPOINT: z.string().url().default('https://usc1.contabostorage.com'),
  CONTABO_PUBLIC_URL: z.string().url(),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .map(err => `${err.path.join('.')}: ${err.message}`)
        .join('\n');

      throw new Error(
        `Invalid environment variables:\n${missingVars}\n\nPlease check your .env file.`
      );
    }
    throw error;
  }
}

export const env = validateEnv();

// Helper to check if we're in production
export const isProd = env.NODE_ENV === 'production';
export const isDev = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';
