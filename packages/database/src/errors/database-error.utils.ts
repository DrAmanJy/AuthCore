import {
  DatabaseConnectionError,
  DatabaseError,
  DuplicateKeyError,
} from "./database.errors.js";

const DATABASE_CONNECTION_ERROR_NAMES = new Set([
  "MongoNetworkError",
  "MongoServerSelectionError",
  "MongoTimeoutError",
  "MongoNotConnectedError",
  "MongooseServerSelectionError",
]);

export function mapDatabaseError(error: unknown): DatabaseError {
  if (error instanceof DatabaseError) {
    return error;
  }

  if (error !== null && typeof error === "object") {
    const errorObject = error as Record<string, unknown>;

    const code = errorObject.code;
    const name = typeof errorObject.name === "string" ? errorObject.name : undefined;

    if (code === 11000 || code === 11001) {
      return new DuplicateKeyError(undefined, {
        cause: error,
      });
    }

    if (name !== undefined && DATABASE_CONNECTION_ERROR_NAMES.has(name)) {
      return new DatabaseConnectionError(undefined, {
        cause: error,
      });
    }
  }

  return new DatabaseError("An unexpected database error occurred.", "DATABASE_ERROR", {
    cause: error,
  });
}
