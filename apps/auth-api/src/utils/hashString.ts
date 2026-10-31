import { config } from "@authcore/config";
import { createHmac } from "node:crypto";

export function hashString(value: string): string {
  return createHmac("sha256", config.hashPepper).update(value, "utf8").digest("hex");
}
