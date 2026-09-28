import { AppError, type AppErrorOptions } from "./app-error.js";
import type { ErrorCode } from "./error-codes.js";
import { ERROR_DEFINITIONS } from "./error-codes.js";

export class ResourceError extends AppError {
  readonly statusCode: number;
  readonly code: ErrorCode;

  constructor(code: ErrorCode, options?: AppErrorOptions) {
    const definition = ERROR_DEFINITIONS[code];

    super(definition.message, options);

    this.code = code;
    this.statusCode = definition.statusCode;
  }
}
