import { EnvironmentSchema } from "./schemas/environment.schema.js";

const parsedEnvironment = EnvironmentSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  HOST: process.env.HOST,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  FRONTEND_URL: process.env.FRONTEND_URL,

  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL,

  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,

  SESSION_EXPIRY: process.env.SESSION_EXPIRY,
  ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY,
  EMAIL_VERIFICATION_TOKEN_EXPIRY: process.env.EMAIL_VERIFICATION_TOKEN_EXPIRY,
  PASSWORD_RESET_TOKEN_EXPIRY: process.env.PASSWORD_RESET_TOKEN_EXPIRY,

  JWT_ISSUER: process.env.JWT_ISSUER,
  JWT_PRIVATE_KEY: process.env.JWT_PRIVATE_KEY,
  JWT_PUBLIC_KEY: process.env.JWT_PUBLIC_KEY,
  JWT_KEY_ID: process.env.JWT_KEY_ID,

  AWS_REGION: process.env.AWS_REGION,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_EMAIL_QUEUE_URL: process.env.AWS_EMAIL_QUEUE_URL,
});

if (!parsedEnvironment.success) {
  const errors = parsedEnvironment.error.issues
    .map(issue => `${issue.path.join(".")}: ${issue.message}`)
    .join("\n");

  throw new Error(`Invalid environment configuration:\n${errors}`);
}

const env = parsedEnvironment.data;

export const config = {
  nodeEnv: env.NODE_ENV,

  app: {
    port: env.PORT,
    host: env.HOST,
    corsOrigin: env.CORS_ORIGIN,
    frontendUrl: env.FRONTEND_URL,
  },

  databaseUrl: env.DATABASE_URL,

  redisUrl: env.REDIS_URL,

  auth: {
    jwtIssuer: env.JWT_ISSUER,
    sessionExpiry: env.SESSION_EXPIRY,
    accessTokenExpiry: env.ACCESS_TOKEN_EXPIRY,
    refreshTokenExpiry: env.REFRESH_TOKEN_EXPIRY,
    jwtPrivateKey: env.JWT_PRIVATE_KEY,
    jwtPublicKey: env.JWT_PUBLIC_KEY,
    jwtKeyId: env.JWT_KEY_ID,
    passwordResetTokenExpiry: env.PASSWORD_RESET_TOKEN_EXPIRY,
    emailVerificationTokenExpiry: env.EMAIL_VERIFICATION_TOKEN_EXPIRY,
  },

  aws: {
    region: env.AWS_REGION,
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    emailQueueUrl: env.AWS_EMAIL_QUEUE_URL,
  },
  email: {
    resendApiKey: env.RESEND_API_KEY,
    from: env.EMAIL_FROM,
  },
} as const;

export type Config = typeof config;
