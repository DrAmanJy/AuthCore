import type {
  AuditLog,
  CreateAuditLogData,
  FindAuditLogCriteria,
} from "./audit-log.types.js";

export interface AuditLogRepository {
  create(data: CreateAuditLogData): Promise<AuditLog>;
  find(criteria: FindAuditLogCriteria): Promise<AuditLog[]>;
  count(criteria: FindAuditLogCriteria): Promise<number>;
}
