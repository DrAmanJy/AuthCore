import pino from "pino";
import { config } from "@authcore/config";

import { getRequestContext } from "./request-context.js";

const isDevelopment = config.nodeEnv === "development";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",

  base: {
    service: "auth-api",
  },

  timestamp: pino.stdTimeFunctions.isoTime,

  mixin() {
    const context = getRequestContext();

    if (!context) {
      return {};
    }

    return {
      requestId: context.requestId,
    };
  },

  redact: {
    paths: [
      "password",
      "passwordHash",
      "accessToken",
      "refreshToken",
      "token",
      "secret",
      "clientSecret",
      "privateKey",
      "authorization",
      "req.headers.authorization",
      "req.headers.cookie",
      "cookies",
    ],
    censor: "[REDACTED]",
  },

  ...(isDevelopment && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      },
    },
  }),
});
