import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

const createRateLimitError = message => {
  return new AppError(`Too many requests: ${message}`, 429);
};

export const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(createRateLimitError("Please try again later."));
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(
      createRateLimitError("Too many authentication attempts. Please try again later.")
    );
  },
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req, res, next) => {
    next(
      createRateLimitError("Too many login attempts. Please try again after 15 minutes.")
    );
  },
});

export const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(
      createRateLimitError(
        "Too many email requests. Please check your inbox or try again in an hour."
      )
    );
  },
});
