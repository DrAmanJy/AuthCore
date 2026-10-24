import type { OrganizationId } from "../organization/organization.types.js";
import type { ActorId, UserId } from "../user/user.types.js";

export type AuditLogId = string & {
  readonly __brand: "AuditLogId";
};

export const asAuditLogId = (id: string): AuditLogId => id as AuditLogId;

export interface AuditLog {
  id: AuditLogId;
  organizationId?: OrganizationId;
  actorId: ActorId;
  action: string;
  targetType: string;
  targetId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface CreateAuditLogData {
  organizationId?: OrganizationId;
  actorId: ActorId;
  action: string;
  targetType: string;
  targetId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface FindAuditLogCriteria {
  organizationId?: OrganizationId;
  actorId?: UserId;
  action?: string;
  targetType?: string;
  limit?: number;
  skip?: number;
}
