import type { NextFunction, Request, Response } from "express";
import type { Device } from "@authcore/database";

export function attachDevice(req: Request, _res: Response, next: NextFunction): void {
  const device: Device = {
    name: getDeviceName(req),
    userAgent: req.get("user-agent") ?? "unknown",
    ip: req.ip ?? "unknown",
  };

  req.device = device;

  next();
}

function getDeviceName(req: Request): string {
  const userAgent = req.get("user-agent");

  if (!userAgent) {
    return "Unknown Device";
  }

  return userAgent;
}
