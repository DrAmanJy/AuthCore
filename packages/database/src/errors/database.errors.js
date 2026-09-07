export class DatabaseError extends Error {
    code;
    constructor(message, code = "DATABASE_ERROR", options) {
        super(message, options);
        this.name = "DatabaseError";
        this.code = code;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
export class DuplicateKeyError extends DatabaseError {
    constructor(message = "A database record already exists.", options) {
        super(message, "DATABASE_DUPLICATE_KEY", options);
        this.name = "DuplicateKeyError";
    }
}
export class DatabaseConnectionError extends DatabaseError {
    constructor(message = "Failed to establish a database connection.", options) {
        super(message, "DATABASE_CONNECTION_ERROR", options);
        this.name = "DatabaseConnectionError";
    }
}
