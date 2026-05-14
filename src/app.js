import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

import { env } from "./config/env.js";
import { buildSwaggerSpec } from "./config/swagger.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { globalLimiter } from "./middleware/rateLimit.middleware.js";
import { AppError } from "./utils/AppError.js";

import userRouter from "./modules/users/user.routes.js";
import sessionRouter from "./modules/sessions/session.routes.js";
import authRouter from "./modules/auth/auth.routes.js";

const app = express();

app.set("trust proxy", env.TRUST_PROXY);

app.disable("x-powered-by");

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(globalLimiter);

if (env.NODE_ENV !== "test") {
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.CORS_ORIGIN.includes(origin)) {
        callback(null, true);
      } else {
        callback(new AppError(`Origin not allowed by CORS`, 403));
      }
    },
    credentials: env.CORS_CREDENTIALS,
  })
);

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

const api = env.API_PREFIX;

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use(`${api}/auth`, authRouter);
app.use(`${api}/user`, userRouter);
app.use(`${api}/session`, sessionRouter);

if (env.ENABLE_API_DOCS) {
  const swaggerSpec = buildSwaggerSpec();
  app.use("/docs", ...swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

app.use((req, res, next) =>
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404))
);

app.use(errorHandler);

export default app;
