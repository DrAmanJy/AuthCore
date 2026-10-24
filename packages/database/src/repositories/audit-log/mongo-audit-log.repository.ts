import type { Types } from "mongoose";
import { AuditLogModel } from "../../models/audit-log.model.js";
import { toObjectId } from "../../utils/object-id.utils.js";
import { asOrganizationId } from "../organization/organization.types.js";
import { asActorId } from "../user/user.types.js";
import type { AuditLogRepository } from "./audit-log.repository.js";
import {
  asAuditLogId,
  type AuditLog,
  type CreateAuditLogData,
  type FindAuditLogCriteria,
} from "./audit-log.types.js";

type MongoAuditRecord = {
  _id: Types.ObjectId;
  organizationId?: Types.ObjectId;
  actorId: Types.ObjectId;
  action: string;
  targetType: string;
  targetId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
};

export class MongoAuditLogRepository implements AuditLogRepository {
  async create(data: CreateAuditLogData): Promise<AuditLog> {
    const record = await AuditLogModel.create({
      organizationId: data.organizationId ? toObjectId(data.organizationId) : undefined,
      actorId: toObjectId(data.actorId),
      action: data.action,
      targetType: data.targetType,
      targetId: data.targetId,
      details: data.details,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });

    return this.toAuditLog(record);
  }

  async find(criteria: FindAuditLogCriteria): Promise<AuditLog[]> {
    const filter: Record<string, unknown> = {};

    if (criteria.organizationId) {
      filter.organizationId = toObjectId(criteria.organizationId);
    }
    if (criteria.actorId) {
      filter.actorId = toObjectId(criteria.actorId);
    }
    if (criteria.action) {
      filter.action = criteria.action;
    }
    if (criteria.targetType) {
      filter.targetType = criteria.targetType;
    }

    const records = await AuditLogModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(criteria.skip ?? 0)
      .limit(criteria.limit ?? 50)
      .lean<MongoAuditRecord[]>()
      .exec();

    return records.map(r => this.toAuditLog(r));
  }

  async count(criteria: FindAuditLogCriteria): Promise<number> {
    const filter: Record<string, unknown> = {};
    if (criteria.organizationId) {
      filter.organizationId = toObjectId(criteria.organizationId);
    }
    if (criteria.action) {
      filter.action = criteria.action;
    }

    return AuditLogModel.countDocuments(filter).exec();
  }

  private toAuditLog(record: MongoAuditRecord): AuditLog {
    return {
      id: asAuditLogId(record._id.toString()),
      organizationId: record.organizationId ? asOrganizationId(record.organizationId.toString()) : undefined,
      actorId: asActorId(record.actorId.toString()),
      action: record.action,
      targetType: record.targetType,
      targetId: record.targetId,
      details: record.details,
      ipAddress: record.ipAddress,
      userAgent: record.userAgent,
      createdAt: record.createdAt,
    };
  }
}
