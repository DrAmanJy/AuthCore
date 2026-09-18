import type { Device, UserId } from "@authcore/database";

import type { AccessTokenPayload } from "../modules/auth/auth.types.js";

declare global {
  namespace Express {
    interface Request {
      device: Device;
      token: AccessTokenPayload;
      user: {
        userId: UserId;
      };
    }
  }
}

export {};
