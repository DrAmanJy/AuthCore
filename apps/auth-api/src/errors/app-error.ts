export interface AppErrorOptions {
  cause?: unknown;
  details?: unknown;
}

export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;

  readonly isOperational = true;
  readonly details?: unknown;

  protected constructor(message: string, options?: AppErrorOptions) {
    super(message, {
      cause: options?.cause,
    });

    this.name = new.target.name;
    this.details = options?.details;

    Error.captureStackTrace(this, new.target);
  }
}
