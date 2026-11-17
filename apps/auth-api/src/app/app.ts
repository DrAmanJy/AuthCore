import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";

import { config } from "@authcore/config";

import { globalErrorHandler } from "../errors/error-handler.js";
import { requestId } from "../middlewares/request-id.js";
import appRouter from "./routes.js";
import { AppError } from "../errors/app-error.js";
import { ERROR_CODES } from "../errors/error-codes.js";

const app = express();

// Trust reverse proxy for accurate client IP resolution
app.set("trust proxy", 1);

app.use(requestId);

app.use(helmet());

app.use(
  cors({
    origin: config.app.corsOrigin,
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.use("/api", appRouter);
app.use((req, _, next) => {
  next(
    new AppError(ERROR_CODES.ROUTE_NOT_FOUND, {
      details: {
        method: req.method,
        path: req.originalUrl,
      },
    }),
  );
});
app.use(globalErrorHandler);

export { app };
