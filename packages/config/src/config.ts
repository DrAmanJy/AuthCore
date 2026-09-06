import { EnvironmentSchema } from "./schemas/environment.schema.js";

const parsedEnvironment = EnvironmentSchema.safeParse(process.env);

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
    accessTokenExpiry: env.ACCESS_TOKEN_EXPIRY,
    refreshTokenExpiry: env.REFRESH_TOKEN_EXPIRY,
    jwtPrivateKey: env.JWT_PRIVATE_KEY,
    jwtPublicKey: env.JWT_PUBLIC_KEY,
    jwtKeyId: env.JWT_KEY_ID,
  },

  aws: {
    region: env.AWS_REGION,
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
} as const;

export type Config = typeof config;
