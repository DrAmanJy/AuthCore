import { ZodError } from "zod";

import { AppError } from "./app-error.js";
import { ERROR_CODES, ERROR_DEFINITIONS } from "./error-codes.js";
import type { ErrorResponseBody, ValidationErrorDetail } from "./error.types.js";

/**
 * Translates any thrown error into a standardized API error response.
 * Centralizes the error-to-response mapping logic.
 */
export function translateError(
  error: unknown,
  requestId: string,
): { statusCode: number; body: ErrorResponseBody } {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      body: {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          requestId,
          ...(error.details !== undefined && {
            details: error.details,
          }),
        },
      },
    };
  }

  if (error instanceof ZodError) {
    const details: ValidationErrorDetail[] = error.issues.map(issue => ({
      path: issue.path,
      message: issue.message,
      code: issue.code,
    }));

    return {
      statusCode: ERROR_DEFINITIONS.VALIDATION_FAILED.statusCode,
      body: {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_FAILED,
          message: ERROR_DEFINITIONS.VALIDATION_FAILED.message,
          requestId,
          details,
        },
      },
    };
  }

  return {
    statusCode: ERROR_DEFINITIONS.INTERNAL_SERVER_ERROR.statusCode,
    body: {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
        message: ERROR_DEFINITIONS.INTERNAL_SERVER_ERROR.message,
        requestId,
      },
    },
  };
}
