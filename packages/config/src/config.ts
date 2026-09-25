import { EnvironmentSchema } from "./schemas/environment.schema.js";

const parsedEnvironment = EnvironmentSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  HOST: process.env.HOST,
  CORS_ORIGIN: process.env.CORS_ORIGIN,

  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL,

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
  },
} as const;

export type Config = typeof config;
