import { z } from "zod";

const authSecret =
  process.env.AUTH_SECRET ??
  process.env.NEXTAUTH_SECRET ??
  (process.env.NODE_ENV === "production"
    ? undefined
    : "dev-only-auth-secret-change-me");

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),
  AUTH_TRUST_HOST: z.enum(["true", "false"]).default("true"),
  INVITE_CODE: z.string().default("maika2026"),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  AUTH_SECRET: authSecret,
  AUTH_TRUST_HOST:
    process.env.AUTH_TRUST_HOST ??
    (process.env.NODE_ENV === "production" ? "false" : "true"),
  INVITE_CODE: process.env.INVITE_CODE,
});

