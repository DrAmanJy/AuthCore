import cors from "cors";
import express from "express";
import helmet from "helmet";

import { config } from "@authcore/config";

import appRouter from "./routes.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: config.app.corsOrigin,
    credentials: true,
  }),
);

app.use(express.json());

app.use("/api", appRouter);

export { app };
