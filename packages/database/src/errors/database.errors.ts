export type DatabaseErrorCode =
  "DATABASE_ERROR" | "DATABASE_DUPLICATE_KEY" | "DATABASE_CONNECTION_ERROR";

export class DatabaseError extends Error {
  public readonly code: DatabaseErrorCode;

  constructor(
    message: string,
    code: DatabaseErrorCode = "DATABASE_ERROR",
    options?: ErrorOptions,
  ) {
    super(message, options);

    this.name = "DatabaseError";
    this.code = code;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class DuplicateKeyError extends DatabaseError {
  constructor(message = "A database record already exists.", options?: ErrorOptions) {
    super(message, "DATABASE_DUPLICATE_KEY", options);

    this.name = "DuplicateKeyError";
  }
}

export class DatabaseConnectionError extends DatabaseError {
  constructor(
    message = "Failed to establish a database connection.",
    options?: ErrorOptions,
  ) {
    super(message, "DATABASE_CONNECTION_ERROR", options);

    this.name = "DatabaseConnectionError";
  }
}
