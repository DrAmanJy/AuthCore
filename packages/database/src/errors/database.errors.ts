export const DATABASE_ERROR_CODES = {
  DATABASE_ERROR: "DATABASE_ERROR",
  DATABASE_DUPLICATE_KEY: "DATABASE_DUPLICATE_KEY",
  DATABASE_CONNECTION_ERROR: "DATABASE_CONNECTION_ERROR",
} as const;

export type DatabaseErrorCode =
  (typeof DATABASE_ERROR_CODES)[keyof typeof DATABASE_ERROR_CODES];

export class DatabaseError extends Error {
  public readonly code: DatabaseErrorCode;

  constructor(
    message: string,
    code: DatabaseErrorCode = DATABASE_ERROR_CODES.DATABASE_ERROR,
    options?: ErrorOptions,
  ) {
    super(message, options);

    this.name = "DatabaseError";
    this.code = code;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, new.target);
  }
}

export class DuplicateKeyError extends DatabaseError {
  constructor(message = "A database record already exists.", options?: ErrorOptions) {
    super(message, DATABASE_ERROR_CODES.DATABASE_DUPLICATE_KEY, options);

    this.name = "DuplicateKeyError";
  }
}

export class DatabaseConnectionError extends DatabaseError {
  constructor(
    message = "Failed to establish a database connection.",
    options?: ErrorOptions,
  ) {
    super(message, DATABASE_ERROR_CODES.DATABASE_CONNECTION_ERROR, options);

    this.name = "DatabaseConnectionError";
  }
}

export class InvalidObjectIdError extends Error {
  public readonly id: string;

  constructor(id: string) {
    super("The provided ID is not a valid ObjectId.");

    this.name = "InvalidObjectIdError";
    this.id = id;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, new.target);
  }
}
