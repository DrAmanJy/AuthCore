import { DatabaseError, DatabaseConnectionError, DuplicateKeyError, } from "./database.errors.js";
export function mapDatabaseError(err) {
    if (err instanceof DatabaseError) {
        return err;
    }
    if (err !== null && typeof err === "object") {
        const errorObj = err;
        const errorCode = errorObj.code;
        const errorName = typeof errorObj.name === "string" ? errorObj.name : "";
        if (errorCode === 11000 || errorCode === 11001) {
            return new DuplicateKeyError(undefined, { cause: err });
        }
        const connectionErrorTypes = [
            "MongoNetworkError",
            "MongoServerSelectionError",
            "MongoTimeoutError",
            "MongoNotConnectedError",
            "MongooseServerSelectionError",
        ];
        if (connectionErrorTypes.includes(errorName)) {
            return new DatabaseConnectionError(undefined, { cause: err });
        }
    }
    return new DatabaseError("An unexpected database error occurred.", "DATABASE_ERROR", {
        cause: err,
    });
}
