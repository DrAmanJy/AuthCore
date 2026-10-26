import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";

import { config } from "@authcore/config";

import { globalErrorHandler } from "../errors/global-error-handler.js";
import { requestId } from "../middlewares/request-id.js";
import appRouter from "./routes.js";

const app = express();

// Trust reverse proxy for accurate client IP resolution
app.set("trust proxy", 1);

// Response timing header
app.use((_req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    res.setHeader("X-Response-Time", `${Date.now() - start}ms`);
  });
  next();
});

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

app.use(globalErrorHandler);

export { app };
