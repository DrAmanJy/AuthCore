import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  APP_NAME: z.string().min(1).default("AuthCore"),
  APP_PORT: z.coerce.number().int().positive().default(5000),
  APP_URL: z.string().url(),
  CLIENT_URL: z.string().url(),
  API_PREFIX: z
    .string()
    .startsWith("/", "API_PREFIX must start with '/'")
    .default("/api/v1"),

  MONGODB_URI: z.string().min(1),
  MONGODB_DB_NAME: z.string().min(1),

  CLOUDINARY_NAME: z.string().min(1),
  CLOUDINARY_KEY: z.string().min(1),
  CLOUDINARY_SECRET: z.string().min(1),

  JWT_ACCESS_PRIVATE_KEY: z.string().min(50),
  JWT_ACCESS_PUBLIC_KEY: z.string().min(50),
  JWT_ACCESS_EXPIRES_IN: z.string().min(2),
  JWT_REFRESH_EXPIRES_IN: z.string().min(2),
  JWT_ISSUER: z.string().min(1),
  JWT_AUDIENCE: z.string().min(1),

  REFRESH_TOKEN_BYTES: z.coerce.number().int().min(32).max(128),
  SESSION_EXPIRY_DAYS: z.coerce.number().int().positive(),

  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(14),

  COOKIE_DOMAIN: z.string().min(1),
  COOKIE_SECURE: z.coerce.boolean(),
  COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]),
  ACCESS_COOKIE_NAME: z.string().min(1),
  REFRESH_COOKIE_NAME: z.string().min(1),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().positive(),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().positive(),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().positive(),

  CORS_ORIGIN: z.string().url(),
  CORS_CREDENTIALS: z.coerce.boolean(),

  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().positive(),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  SMTP_FROM: z.string().min(1),

  EMAIL_VERIFICATION_EXPIRES_IN: z.string().min(2),
  PASSWORD_RESET_EXPIRES_IN: z.string().min(2),

  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]),

  TRUST_PROXY: z.coerce.boolean(),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("\nInvalid environment variables:\n");

  const formattedErrors = z.treeifyError(parsedEnv.error);

  for (const [key, value] of Object.entries(formattedErrors.properties ?? {})) {
    if (value?.errors?.length) {
      console.error(`• ${key}: ${value.errors.join(", ")}`);
    }
  }

  process.exit(1);
}

export const env = Object.freeze(parsedEnv.data);
