import type { NextFunction, Request, Response } from "express";
import { authorizationService } from "../container.js";
import getAuthToken from "../utils/token.js";
import type { PermissionKey } from "@authcore/contracts";
import type { OrganizationId } from "@authcore/database";
import { AppError } from "../errors/app-error.js";
import { ERROR_CODES } from "../errors/error-codes.js";

export async function resolveOrgContext(
  req: Request<{ organizationId?: OrganizationId }>,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { sub, orgId: tokenOrgId } = getAuthToken(req);
    const paramOrgId = req.params.organizationId;

    if (!paramOrgId) {
      throw new AppError(ERROR_CODES.ORGANIZATION_NOT_FOUND);
    }

    if (tokenOrgId && paramOrgId !== tokenOrgId) {
      throw new AppError(ERROR_CODES.ORGANIZATION_ACCESS_DENIED);
    }

    req.orgContext = await authorizationService.getMemberContext(paramOrgId, sub);
    next();
  } catch (error) {
    next(error);
  }
}

export function requirePermission(...requiredPermissions: PermissionKey[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const context = req.orgContext;
    if (!context) {
      throw new AppError("AUTH_UNAUTHORIZED");
    }

    if (context.isOwner) {
      next();
      return;
    }

    const hasAllPermissions = requiredPermissions.every(permission =>
      context.permissions.has(permission),
    );
    if (!hasAllPermissions) {
      throw new AppError("AUTH_INSUFFICIENT_PERMISSIONS");
    }
    next();
  };
}

export function requireAnyPermission(...permissions: PermissionKey[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const context = req.orgContext;
    if (!context) {
      throw new AppError("AUTH_UNAUTHORIZED");
    }
    if (context.isOwner) {
      next();
      return;
    }
    const hasAny = permissions.some(permission => context.permissions.has(permission));
    if (!hasAny) {
      throw new AppError("AUTH_INSUFFICIENT_PERMISSIONS");
    }
    next();
  };
}
