import { UAParser } from "ua-parser-js";
import { Request } from "express";
import { Device } from "../modules/sessions/session.model.js";

type ClientInfo = {
  ipAddress: string;
  userAgent: string;
  device: Device;
};

export const getClientInfo = (req: Request): ClientInfo => {
  const forwardedFor = req.headers["x-forwarded-for"];

  const ipAddress =
    (typeof forwardedFor === "string" ? forwardedFor.split(",")[0] : undefined) ||
    req.ip ||
    "Unknown IP";

  const userAgent = req.headers["user-agent"] || "Unknown User Agent";

  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  const device = {
    deviceName: result.device.model || result.device.vendor || "Desktop/Unknown",
    browser: result.browser.name || "Unknown Browser",
    os: result.os.name || "Unknown OS",
  };

  return {
    ipAddress,
    userAgent,
    device,
  };
};
