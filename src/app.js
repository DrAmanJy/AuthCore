import express from "express";
import cors from "cors";
import { errorHandler } from "./middleware/error.middleware.js";
import { AppError } from "./utils/AppError.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1kb" }));

app.use((req, res, next) =>
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 501))
);

app.use(errorHandler);
export default app;
