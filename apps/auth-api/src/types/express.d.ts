import type { ApiKey, Device, User } from "@authcore/database";

import type { AccessTokenPayload } from "../modules/auth/auth.types.js";
import type { OrgContext } from "../modules/organization/authorization/authorization.service.ts";

declare global {
  namespace Express {
    interface Request {
      device?: Device;
      token?: AccessTokenPayload;
      requestId: string;
      apiKey?: ApiKey;
      user?: User;
      orgContext?: OrgContext;
    }
  }
}

export {};
