import mongoose from "mongoose";
import { config } from "@authcore/config";
import { DatabaseConnectionError } from "../errors/database.errors.js";
let connectionPromise = null;
export async function connectDatabase() {
    if (mongoose.connection.readyState === 1) {
        return;
    }
    if (connectionPromise) {
        await connectionPromise;
        return;
    }
    connectionPromise = mongoose
        .connect(config.databaseUrl, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5_000,
        socketTimeoutMS: 45_000,
    })
        .catch((error) => {
        connectionPromise = null;
        throw new DatabaseConnectionError("Failed to connect to the database.", {
            cause: error,
        });
    });
    await connectionPromise;
}
export async function disconnectDatabase() {
    if (mongoose.connection.readyState === 0) {
        return;
    }
    try {
        await mongoose.disconnect();
        connectionPromise = null;
    }
    catch (error) {
        throw new DatabaseConnectionError("Failed to close the database connection gracefully.", {
            cause: error,
        });
    }
}
