import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(3001),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  WEB_URL: z.string().url().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  // S3/MinIO (optional — document features disabled when not configured)
  S3_BUCKET: z.string().default('crm-documents'),
  S3_REGION: z.string().default('us-east-1'),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('â Œ Invalid environment variables:', result.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}

export const env = result.data;
