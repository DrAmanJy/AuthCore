import z from "zod";

const environments = ["development", "production"] as const;

const portSchema = z.coerce
  .number("PORT must be a number")
  .int("PORT must be an integer")
  .min(1, "PORT must be at least 1")
  .max(65535, "PORT must be at most 65535");

const hostSchema = z.string().trim().min(1, "HOST is required");

const databaseUrlSchema = z
  .string()
  .trim()
  .min(1, "DATABASE_URL is required")
  .refine(
    value => value.startsWith("mongodb://") || value.startsWith("mongodb+srv://"),
    "DATABASE_URL must be a valid MongoDB connection string",
  );

const redisUrlSchema = z
  .string()
  .trim()
  .min(1, "REDIS_URL is required")
  .refine(
    value => value.startsWith("redis://") || value.startsWith("rediss://"),
    "REDIS_URL must be a valid Redis connection string",
  );

export const EnvironmentSchema = z
  .strictObject({
    NODE_ENV: z.enum(environments, {
      error: issue => {
        if (issue.input === undefined) {
          return "NODE_ENV is required";
        }

        return `NODE_ENV must be one of: ${environments.join(", ")}`;
      },
    }),

    PORT: portSchema,

    HOST: hostSchema,

    CORS_ORIGIN: z.url("CORS_ORIGIN must be a valid URL"),

    DATABASE_URL: databaseUrlSchema,

    REDIS_URL: redisUrlSchema,

    ACCESS_TOKEN_EXPIRY: z.string().trim().min(1, "ACCESS_TOKEN_EXPIRY is required"),

    REFRESH_TOKEN_EXPIRY: z.string().trim().min(1, "REFRESH_TOKEN_EXPIRY is required"),

    JWT_PRIVATE_KEY: z.string().min(1, "JWT_PRIVATE_KEY is required"),

    JWT_PUBLIC_KEY: z.string().min(1, "JWT_PUBLIC_KEY is required"),

    JWT_KEY_ID: z.string().trim().min(1, "JWT_KEY_ID is required"),

    AWS_REGION: z.string().trim().min(1, "AWS_REGION is required"),

    AWS_ACCESS_KEY_ID: z.string().trim().min(1, "AWS_ACCESS_KEY_ID is required"),

    AWS_SECRET_ACCESS_KEY: z.string().min(1, "AWS_SECRET_ACCESS_KEY is required"),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === "production") {
      if (!env.JWT_PRIVATE_KEY.includes("-----BEGIN")) {
        ctx.addIssue({
          code: "custom",
          path: ["JWT_PRIVATE_KEY"],
          message: "JWT_PRIVATE_KEY must be a valid PEM-formatted private key",
        });
      }

      if (!env.JWT_PUBLIC_KEY.includes("-----BEGIN")) {
        ctx.addIssue({
          code: "custom",
          path: ["JWT_PUBLIC_KEY"],
          message: "JWT_PUBLIC_KEY must be a valid PEM-formatted public key",
        });
      }
    }
  });

export type Environment = z.infer<typeof EnvironmentSchema>;
