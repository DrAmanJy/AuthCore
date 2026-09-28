import { AppError, type AppErrorOptions } from "./app-error.js";
import { ERROR_CODES, ERROR_DEFINITIONS } from "./error-codes.js";

export class InternalServerError extends AppError {
  readonly statusCode = ERROR_DEFINITIONS[ERROR_CODES.INTERNAL_SERVER_ERROR].statusCode;

  readonly code = ERROR_CODES.INTERNAL_SERVER_ERROR;

  constructor(options?: AppErrorOptions) {
    super(ERROR_DEFINITIONS[ERROR_CODES.INTERNAL_SERVER_ERROR].message, options);
  }
}
