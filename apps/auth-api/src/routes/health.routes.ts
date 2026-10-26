import { Router } from "express";
import mongoose from "mongoose";

const healthRouter = Router();

healthRouter.get("/live", (_req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

healthRouter.get("/ready", (_req, res) => {
  const dbState = mongoose.connection.readyState;
  const isDbConnected = dbState === 1;

  if (!isDbConnected) {
    res.status(503).json({
      status: "degraded",
      services: {
        database: "disconnected",
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  res.status(200).json({
    status: "ok",
    services: {
      database: "connected",
    },
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export { healthRouter };
