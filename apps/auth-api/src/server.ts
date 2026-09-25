import { config } from "@authcore/config";
import { connectDatabase, disconnectDatabase } from "@authcore/database";

import { app } from "./app/app.js";

async function startServer(): Promise<void> {
  try {
    await connectDatabase();

    const server = app.listen(config.app.port, config.app.host, () => {
      console.info(`Server running at http://${config.app.host}:${config.app.port}`);
    });

    const shutdown = (signal: string): void => {
      console.info(`${signal} received. Shutting down...`);

      server.close(() => {
        void disconnectDatabase()
          .then(() => {
            console.info("Server shut down successfully");
            process.exit(0);
          })
          .catch(error => {
            console.error("Failed to disconnect database:", error);
            process.exit(1);
          });
      });
    };

    process.once("SIGINT", () => {
      shutdown("SIGINT");
    });

    process.once("SIGTERM", () => {
      shutdown("SIGTERM");
    });

    server.on("error", error => {
      console.error("Server error:", error);

      void disconnectDatabase()
        .then(() => {
          process.exit(1);
        })
        .catch(disconnectError => {
          console.error("Failed to disconnect database:", disconnectError);
          process.exit(1);
        });
    });
  } catch (error) {
    console.error("Failed to start server:", error);

    await disconnectDatabase();
    process.exit(1);
  }
}

await startServer();
