import { Router } from "express";

const healthRouter = Router();

healthRouter.get("/live", (_req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export { healthRouter };
