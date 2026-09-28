import { AppError, type AppErrorOptions } from "./app-error.js";
import { ERROR_DEFINITIONS, type ErrorCode } from "./error-codes.js";

export class AuthenticationError extends AppError {
  readonly statusCode = 401;
  readonly code: ErrorCode;

  constructor(code: ErrorCode, options?: AppErrorOptions) {
    super(ERROR_DEFINITIONS[code].message, options);

    this.code = code;
  }
}

export class TokenExpiredError extends AuthenticationError {
  readonly expiredAt: Date;

  constructor(code: ErrorCode, expiredAt: Date, options?: AppErrorOptions) {
    super(code, options);

    this.expiredAt = expiredAt;
  }
}
