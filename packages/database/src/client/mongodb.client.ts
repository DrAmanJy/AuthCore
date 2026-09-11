import mongoose, { ConnectionStates } from "mongoose";

import { config } from "@authcore/config";
import { DatabaseConnectionError } from "../errors/database.errors.js";

let connectionPromise: Promise<typeof mongoose> | null = null;

export async function connectDatabase(): Promise<void> {
  if (mongoose.connection.readyState === ConnectionStates.connected) {
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
    } as mongoose.ConnectOptions)
    .catch((error: unknown) => {
      connectionPromise = null;

      throw new DatabaseConnectionError("Failed to connect to the database.", {
        cause: error,
      });
    });

  await connectionPromise;
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState === ConnectionStates.disconnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    connectionPromise = null;
  } catch (error: unknown) {
    throw new DatabaseConnectionError(
      "Failed to close the database connection gracefully.",
      {
        cause: error,
      },
    );
  }
}
