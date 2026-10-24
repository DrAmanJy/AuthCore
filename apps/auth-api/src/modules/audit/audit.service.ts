import type {
  AuditLog,
  AuditLogRepository,
  CreateAuditLogData,
  FindAuditLogCriteria,
} from "@authcore/database";
import { logger } from "@authcore/logger";

export class AuditService {
  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  async logEvent(data: CreateAuditLogData): Promise<void> {
    try {
      await this.auditLogRepository.create(data);
    } catch (error) {
      logger.error(
        {
          event: "audit.log.failed",
          action: data.action,
          err: error,
        },
        "Failed to write audit log record",
      );
    }
  }

  async getOrganizationLogs(
    criteria: FindAuditLogCriteria,
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const [logs, total] = await Promise.all([
      this.auditLogRepository.find(criteria),
      this.auditLogRepository.count(criteria),
    ]);

    return { logs, total };
  }
}
