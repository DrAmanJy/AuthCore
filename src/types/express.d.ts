import "express";
import type { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      service: YourServiceType;
      accessToken: JwtPayload;
    }
  }
}
