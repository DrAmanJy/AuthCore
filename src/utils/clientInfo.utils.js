import UAParser from "ua-parser-js";

export const getClientInfo = req => {
  const ipAddress =
    req.headers["x-forwarded-for"]?.split(",")[0] || req.ip || "Unknown IP";

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
