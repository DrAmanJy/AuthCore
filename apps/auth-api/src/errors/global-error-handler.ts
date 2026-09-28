import type { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import { AppError } from "./app-error.js";
import { ZodError } from "zod";
import { ERROR_CODES, ERROR_DEFINITIONS } from "./error-codes.js";

export function globalErrorHandler(
  error: ErrorRequestHandler,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (res.headersSent) {
    next(error);
    return;
  }
  const requestId = req.requestId;

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        requestId,
        ...(error.details !== undefined && {
          details: error.details,
        }),
      },
    });
  }
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_FAILED,
        message: ERROR_DEFINITIONS.VALIDATION_FAILED.message,
        requestId,
        details: error.issues.map(issue => ({
          path: issue.path,
          message: issue.message,
          code: issue.code,
        })),
      },
    });
  }

  //   req.log?.error(
  //     {
  //       err: error,
  //       requestId,
  //     },
  //     "Unhandled application error",
  //   );
  console.error(error);
  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred.",
      requestId,
    },
  });
}
