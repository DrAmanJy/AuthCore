import type { Response } from "express";
import type { FindManyOptions, PaginatedResult } from "@authcore/database";

export interface PaginationMeta {
  nextCursor: string | null;
  hasNextPage: boolean;
}

export interface PaginatedData<T> {
  items: T[];
  pagination: PaginationMeta;
  nextCursor: string | null;
}

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

export function getPaginationOptions(query: {
  limit?: unknown;
  cursor?: unknown;
}): FindManyOptions | undefined {
  const limit =
    typeof query.limit === "string" || typeof query.limit === "number"
      ? Math.min(Math.max(Number(query.limit) || 20, 1), 100)
      : undefined;

  const cursor =
    typeof query.cursor === "string" && query.cursor.trim()
      ? query.cursor.trim()
      : undefined;

  if (limit === undefined && cursor === undefined) {
    return undefined;
  }

  return {
    limit: limit ?? 20,
    cursor,
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

export function sendPaginated<T>(
  res: Response,
  result: PaginatedResult<T>,
  message?: string,
  statusCode = 200,
): void {
  sendSuccess(
    res,
    {
      items: result.items,
      nextCursor: result.nextCursor,
      pagination: {
        nextCursor: result.nextCursor,
        hasNextPage: result.nextCursor !== null,
      },
    },
    message,
    statusCode,
  );
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
