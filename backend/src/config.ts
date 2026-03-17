import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16).default("access-secret-change-me-1234"),
  JWT_REFRESH_SECRET: z.string().min(16).default("refresh-secret-change-me-1234"),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
  FRONTEND_URL: z.string().default("http://localhost:3000"),
});

export const env = envSchema.parse(process.env);
