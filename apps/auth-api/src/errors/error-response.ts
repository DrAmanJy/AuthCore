import type { Response } from "express";
import type { AppError } from "./app-error.js";
import { ERROR_DEFINITIONS, type ErrorCode } from "./error-codes.js";
import type { ErrorResponseBody } from "./error.types.js";

/**
 * Builds a standardized error response body from an AppError.
 */
export function buildErrorResponse(
  error: AppError,
  requestId: string,
): ErrorResponseBody {
  return {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      requestId,
      ...(error.details !== undefined && {
        details: error.details,
      }),
    },
  };
}

/**
 * Builds a standardized error response body from an error code.
 */
export function buildErrorResponseFromCode(
  code: ErrorCode,
  requestId: string,
  details?: unknown,
): ErrorResponseBody {
  const definition = ERROR_DEFINITIONS[code];

  return {
    success: false,
    error: {
      code,
      message: definition.message,
      requestId,
      ...(details !== undefined && { details }),
    },
  };
}

/**
 * Sends a standardized error response.
 */
export function sendErrorResponse(
  res: Response,
  code: ErrorCode,
  requestId: string,
  details?: unknown,
): void {
  const definition = ERROR_DEFINITIONS[code];

  res.status(definition.statusCode).json(
    buildErrorResponseFromCode(code, requestId, details),
  );
}
