import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDb() {
  const conn = await mongoose.connect(env.MONGODB_URI, {
    dbName: env.MONGODB_DB_NAME,
  });

  console.info(`MongoDB Connected: ${conn.connection.host}`);
}
