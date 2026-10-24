import type { Request, Response } from "express";
import { asOrganizationId } from "@authcore/database";
import type { AuditService } from "./audit.service.js";
import { sendSuccess } from "../../utils/response.utils.js";
import type { AuditQuery, OrganizationAuditParams } from "@authcore/contracts";

export class AuditController {
  constructor(private readonly auditService: AuditService) {
    this.getOrganizationLogs = this.getOrganizationLogs.bind(this);
  }

  async getOrganizationLogs(
    req: Request<OrganizationAuditParams, unknown, unknown, AuditQuery>,
    res: Response,
  ) {
    const { organizationId } = req.params;
    const { action, targetType, limit = 50, page = 1 } = req.query;

    const skip = (page - 1) * limit;

    const result = await this.auditService.getOrganizationLogs({
      organizationId: asOrganizationId(organizationId),
      action,
      targetType,
      limit,
      skip,
    });

    sendSuccess(res, result, "Audit logs retrieved successfully");
  }
}
