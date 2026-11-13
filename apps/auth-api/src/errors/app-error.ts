import { ERROR_DEFINITIONS, type ErrorCode } from "./error-codes.js";

export interface AppErrorOptions {
  cause?: unknown;
  details?: unknown;
}

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode;
  readonly isOperational = true;
  readonly details?: unknown;

  constructor(code: ErrorCode, options?: AppErrorOptions) {
    const def = ERROR_DEFINITIONS[code];
    super(def.message, { cause: options?.cause });

    this.name = "AppError";
    this.code = code;
    this.statusCode = def.statusCode;
    this.details = options?.details;

    Error.captureStackTrace(this, AppError);
  }
}
