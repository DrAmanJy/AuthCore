import type { NextFunction, Request, Response } from "express";
import { AuthenticationError } from "../errors/authentication-error.js";
import { AuthorizationError } from "../errors/authorization-error.js";
import { ERROR_CODES } from "../errors/error-codes.js";
import { organizationService } from "../container.js";
import { asOrganizationId, asUserId } from "@authcore/database";

export function requirePermission(permission: string) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.token;
      if (!token) {
        throw new AuthenticationError(ERROR_CODES.AUTH_UNAUTHORIZED);
      }

      const orgIdParam = req.params.organizationId as string | undefined;
      const organizationId = orgIdParam ? asOrganizationId(orgIdParam) : token.orgId;

      if (token.orgId !== organizationId) {
        throw new AuthorizationError(ERROR_CODES.ORGANIZATION_ACCESS_DENIED);
      }

      const permissions = await organizationService.getMemberPermissions(
        organizationId,
        asUserId(token.sub),
      );

      if (!permissions.includes(permission)) {
        throw new AuthorizationError(ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
