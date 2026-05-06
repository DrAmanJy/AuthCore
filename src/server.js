import app from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";

const PORT = env.APP_PORT;

try {
  await connectDb();
  app.listen(PORT, () => {
    console.info(`Server is running on http://localhost:${PORT}`);
  });
} catch (error) {
  console.error(error, "FAILED TO START SERVER");
}
