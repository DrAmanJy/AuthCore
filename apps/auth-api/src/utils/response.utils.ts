import type { Response } from "express";

export interface SuccessResponse<T> {
  success: true;
  message?: string;
  data: T;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    requestId: string;
    details?: unknown;
  };
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200,
): void {
  res.status(statusCode).json({
    success: true,
    ...(message !== undefined && {
      message,
    }),
    data,
  });
}

export function sendCreated<T>(res: Response, data: T, message?: string): void {
  sendSuccess(res, data, message, 201);
}

export function sendNoContent(res: Response): Response {
  return res.status(204).send();
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  requestId: string,
  details?: unknown,
): void {
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      requestId,
      ...(details !== undefined && {
        details,
      }),
    },
  });
}
