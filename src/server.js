import mongoose from "mongoose";
import app from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";

const PORT = env.APP_PORT;

function gracefulShutdown(server, signal) {
  return () => {
    console.info(`${signal} received, closing HTTP server`);
    server.close(async closeErr => {
      if (closeErr) {
        console.error(closeErr);
      }
      try {
        await mongoose.connection.close();
        console.info("MongoDB connection closed");
      } catch (err) {
        console.error(err);
      }
      process.exit(closeErr ? 1 : 0);
    });
    setTimeout(() => {
      console.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10_000).unref();
  };
}

try {
  await connectDb();
  const server = app.listen(PORT, () => {
    console.info(`Server is running on port ${PORT} (${env.NODE_ENV})`);
  });

  process.on("SIGTERM", gracefulShutdown(server, "SIGTERM"));
  process.on("SIGINT", gracefulShutdown(server, "SIGINT"));
} catch (error) {
  console.error(error, "FAILED TO START SERVER");
  process.exit(1);
}
