import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error.js";
import { ERROR_CODES } from "../errors/error-codes.js";

export class RateLimitError extends AppError {
  readonly code = ERROR_CODES.RATE_LIMIT_EXCEEDED;
  readonly statusCode = 429;

  constructor(public readonly retryAfterSeconds: number) {
    super(ERROR_CODES.RATE_LIMIT_EXCEEDED);
  }
}

interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyGenerator?: (req: Request) => string;
}

interface RequestRecord {
  timestamps: number[];
}

export function createRateLimiter(options: RateLimitOptions) {
  const { windowMs, max, keyGenerator = (req: Request) => req.ip ?? "unknown" } = options;
  const store = new Map<string, RequestRecord>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = keyGenerator(req);
    const now = Date.now();
    const windowStart = now - windowMs;

    let record = store.get(key);
    if (!record) {
      record = { timestamps: [] };
      store.set(key, record);
    }

    // Filter out timestamps outside window
    record.timestamps = record.timestamps.filter(t => t > windowStart);

    if (record.timestamps.length >= max) {
      const oldestTimestamp = record.timestamps[0];
      const retryAfter = Math.ceil((oldestTimestamp + windowMs - now) / 1000);
      res.setHeader("Retry-After", retryAfter.toString());
      res.setHeader("X-RateLimit-Limit", max.toString());
      res.setHeader("X-RateLimit-Remaining", "0");
      res.setHeader("X-RateLimit-Reset", Math.ceil((oldestTimestamp + windowMs) / 1000).toString());
      throw new RateLimitError(retryAfter);
    }

    record.timestamps.push(now);
    res.setHeader("X-RateLimit-Limit", max.toString());
    res.setHeader("X-RateLimit-Remaining", (max - record.timestamps.length).toString());

    next();
  };
}
