import type { QueryFilter } from "mongoose";
import type { IPermission } from "../../models/permission.model.js";
import PermissionModel from "../../models/permission.model.js";
import { toObjectId } from "../../utils/object-id.utils.js";
import { asOrganizationId } from "../organization/organization.types.js";
import type { FindManyOptions, PaginatedResult } from "../repository-pagination.types.js";
import type { CreatedBy } from "../user/user.types.js";
import type { PermissionRepository } from "./permission.repository.js";
import {
  asPermissionId,
  type CreatePermissionData,
  type FindManyPermissionsCriteria,
  type FindPermissionCriteria,
  type Permission,
  type UpdatePermissionData,
} from "./permission.types.js";

type PermissionRecord = IPermission & {
  createdBy?: CreatedBy;
};

export class MongoPermissionRepository implements PermissionRepository {
  async find(criteria: FindPermissionCriteria): Promise<Permission | null> {
    const filter: QueryFilter<IPermission> = {
      organizationId: toObjectId(criteria.organizationId),
      deletedAt: { $exists: false },
      ...(criteria.by === "id"
        ? { _id: toObjectId(criteria.permissionId) }
        : { key: criteria.key }),
    };

    const permission = await PermissionModel.findOne(filter)
      .populate({
        path: "createdBy",
        select: "_id displayName",
      })
      .lean<PermissionRecord>()
      .exec();

    return permission ? this.toPermission(permission) : null;
  }

  async findSystemPermissions(): Promise<Permission[]> {
    const permissions = await PermissionModel.find({
      scope: "system",
      deletedAt: { $exists: false },
    })
      .populate({
        path: "createdBy",
        select: "_id displayName",
      })
      .lean<PermissionRecord[]>()
      .exec();

    return permissions.map(p => this.toPermission(p));
  }

  async findMany(
    criteria: FindManyPermissionsCriteria,
    options?: FindManyOptions,
  ): Promise<PaginatedResult<Permission>> {
    const filter: QueryFilter<IPermission> = {
      organizationId: toObjectId(criteria.organizationId),
      deletedAt: { $exists: false },
      ...(criteria.roleId && { roleId: toObjectId(criteria.roleId) }),
    };

    const limit = Math.min(Math.max(options?.limit ?? 20, 1), 100);

    if (options?.cursor) {
      filter._id = {
        $gt: toObjectId(options.cursor),
      };
    }

    const records = await PermissionModel.find(filter)
      .populate({
        path: "createdBy",
        select: "_id displayName",
      })
      .sort({ _id: 1 })
      .limit(limit + 1)
      .lean<PermissionRecord[]>()
      .exec();

    const hasNextPage = records.length > limit;
    const pagedRecords = hasNextPage ? records.slice(0, limit) : records;
    const items = pagedRecords.map(record => this.toPermission(record));
    const nextCursor = hasNextPage ? (items.at(-1)?.id ?? null) : null;

    return {
      items,
      nextCursor,
    };
  }

  async create(data: CreatePermissionData): Promise<Permission> {
    const permission = await PermissionModel.create({
      ...(data.organizationId && { organizationId: toObjectId(data.organizationId) }),
      key: data.key,
      description: data.description,
      ...(data.scope && { scope: data.scope }),
      ...(data.createdBy && { createdBy: toObjectId(data.createdBy) }),
    });

    const permissionRecord = await PermissionModel.findById(permission.id)
      .populate({
        path: "createdBy",
        select: "_id displayName",
      })
      .lean<PermissionRecord>()
      .exec();

    if (!permissionRecord) {
      throw new Error("Permission was created but could not be retrieved.");
    }

    return this.toPermission(permissionRecord);
  }

  async update(
    criteria: FindPermissionCriteria,
    data: UpdatePermissionData,
  ): Promise<Permission | null> {
    const permission = await PermissionModel.findOneAndUpdate(
      {
        ...(criteria.by === "id"
          ? { _id: toObjectId(criteria.permissionId) }
          : { key: criteria.key }),
        organizationId: toObjectId(criteria.organizationId),
        deletedAt: { $exists: false },
      },
      {
        $set: {
          data,
        },
      },
      { returnDocument: "after", runValidators: true },
    )
      .populate({
        path: "createdBy",
        select: "_id displayName",
      })
      .lean<PermissionRecord>()
      .exec();

    return permission ? this.toPermission(permission) : null;
  }

  async softDelete(criteria: FindPermissionCriteria): Promise<Permission | null> {
    const permission = await PermissionModel.findOneAndUpdate(
      {
        ...(criteria.by === "id"
          ? { _id: toObjectId(criteria.permissionId) }
          : { key: criteria.key }),
        organizationId: toObjectId(criteria.organizationId),
        deletedAt: { $exists: false },
      },
      {
        $set: { deletedAt: new Date() },
      },
      { returnDocument: "after", runValidators: true },
    )
      .populate({
        path: "createdBy",
        select: "_id displayName",
      })
      .lean<PermissionRecord>()
      .exec();

    return permission ? this.toPermission(permission) : null;
  }

  async delete(criteria: FindPermissionCriteria): Promise<boolean> {
    const result = await PermissionModel.findOneAndDelete({
      ...(criteria.by === "id"
        ? { _id: toObjectId(criteria.permissionId) }
        : { key: criteria.key }),
      organizationId: toObjectId(criteria.organizationId),
      deletedAt: { $exists: true },
    }).exec();

    return Boolean(result);
  }

  private toPermission(record: PermissionRecord): Permission {
    return {
      id: asPermissionId(record._id.toString()),
      scope: record.scope,
      ...(record.organizationId && {
        organizationId: asOrganizationId(record.organizationId.toString()),
      }),
      key: record.key,
      description: record.description,
      ...(record.deletedAt && { deletedAt: record.deletedAt }),
      createdBy: record.createdBy,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
