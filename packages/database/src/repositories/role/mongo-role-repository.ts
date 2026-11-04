import type { QueryFilter, Types } from "mongoose";
import type { IPermissions } from "../../models/permission.model.js";
import type { IRole } from "../../models/role.model.js";
import { RoleModel } from "../../models/role.model.js";
import { toObjectId } from "../../utils/object-id.utils.js";
import { asOrganizationId, type OrganizationId } from "../organization/organization.types.js";
import type { FindManyOptions, PaginatedResult } from "../repository-pagination.types.js";
import { asUserId } from "../user/user.types.js";
import type { RoleRepository } from "./role-repository.js";
import {
  asRoleId,
  type CreateRoleData,
  type DeleteRoleCriteria,
  type FindManyRolesCriteria,
  type FindRoleCriteria,
  type Role,
  type UpdateRoleCriteria,
  type UpdateRoleData,
} from "./role.types.js";

type MongoRoleRecord = Omit<IRole, "createdBy" | "permissionIds"> & {
  createdBy: {
    _id: Types.ObjectId;
    displayName: string;
  };
  permissionIds: Pick<IPermissions, "_id" | "key">[];
};

export class MongoRoleRepository implements RoleRepository {
  async find(criteria: FindRoleCriteria): Promise<Role | null> {
    const filter: QueryFilter<IRole> = {
      organizationId: toObjectId(criteria.organizationId),
      deletedAt: { $exists: false },
    };

    if (criteria.by === "id") {
      filter._id = toObjectId(criteria.roleId);
    } else {
      filter.name = criteria.name;
    }

    const role = await RoleModel.findOne(filter)
      .populate({
        path: "createdBy",
        select: "_id displayName",
      })
      .populate({
        path: "permissionIds",
        select: "key",
      })
      .lean<MongoRoleRecord>()
      .exec();

    return role ? this.toRole(role) : null;
  }

  async findMany(
    criteria: FindManyRolesCriteria,
    options?: FindManyOptions,
  ): Promise<PaginatedResult<Role>> {
    const filter: QueryFilter<IRole> = {
      organizationId: toObjectId(criteria.organizationId),
      deletedAt: { $exists: false },
      ...(criteria.isSystemRole !== undefined && { isSystemRole: criteria.isSystemRole }),
    };

    const limit = Math.min(Math.max(options?.limit ?? 20, 1), 100);

    if (options?.cursor) {
      filter._id = {
        $gt: toObjectId(options.cursor),
      };
    }

    const records = await RoleModel.find(filter)
      .populate({
        path: "createdBy",
        select: "_id displayName",
      })
      .populate({
        path: "permissionIds",
        select: "key",
      })
      .sort({ _id: 1 })
      .limit(limit + 1)
      .lean<MongoRoleRecord[]>()
      .exec();

    const hasNextPage = records.length > limit;
    const pagedRecords = hasNextPage ? records.slice(0, limit) : records;
    const roles = pagedRecords.map(record => this.toRole(record));
    const nextCursor = hasNextPage ? (roles.at(-1)?.id ?? null) : null;

    return {
      items: roles,
      nextCursor,
    };
  }

  async findDefault(organizationId: OrganizationId): Promise<Role | null> {
    const role = await RoleModel.findOne({
      organizationId: toObjectId(organizationId),
      isSystemRole: true,
      deletedAt: { $exists: false },
    })
      .sort({ createdAt: 1 })
      .populate({
        path: "createdBy",
        select: "_id displayName",
      })
      .populate({
        path: "permissionIds",
        select: "key",
      })
      .lean<MongoRoleRecord>()
      .exec();

    return role ? this.toRole(role) : null;
  }

  async create(data: CreateRoleData): Promise<Role> {
    const role = await RoleModel.create({
      organizationId: toObjectId(data.organizationId),
      name: data.name,
      createdBy: toObjectId(data.actorId),
      isSystemRole: data.isSystemRole,
      permissionIds: [],
    });

    const populatedRole = await RoleModel.findById(role._id)
      .populate({
        path: "createdBy",
        select: "_id displayName",
      })
      .populate({
        path: "permissionIds",
        select: "key",
      })
      .lean<MongoRoleRecord>()
      .exec();

    if (!populatedRole) {
      throw new Error("Role was created but could not be retrieved.");
    }

    return this.toRole(populatedRole);
  }

  async update(
    criteria: UpdateRoleCriteria,
    data: UpdateRoleData,
  ): Promise<Role | null> {
    const updateQuery: {
      $set?: {
        name?: string;
      };
    } = {};

    if (data.name !== undefined) {
      updateQuery.$set = { name: data.name };
    }

    const role = await RoleModel.findOneAndUpdate(
      {
        _id: toObjectId(criteria.roleId),
        organizationId: toObjectId(criteria.organizationId),
        deletedAt: { $exists: false },
      },
      updateQuery.$set ? updateQuery : {},
      {
        returnDocument: "after",
        runValidators: true,
      },
    )
      .populate({
        path: "createdBy",
        select: "_id displayName",
      })
      .populate({
        path: "permissionIds",
        select: "key",
      })
      .lean<MongoRoleRecord>()
      .exec();

    return role ? this.toRole(role) : null;
  }

  async softDelete(criteria: DeleteRoleCriteria): Promise<Role | null> {
    const role = await RoleModel.findOneAndUpdate(
      {
        _id: toObjectId(criteria.roleId),
        organizationId: toObjectId(criteria.organizationId),
        deletedAt: { $exists: false },
      },
      {
        $set: {
          deletedAt: new Date(),
        },
      },
      {
        returnDocument: "after",
        runValidators: true,
      },
    )
      .populate({
        path: "createdBy",
        select: "_id displayName",
      })
      .populate({
        path: "permissionIds",
        select: "key",
      })
      .lean<MongoRoleRecord>()
      .exec();

    return role ? this.toRole(role) : null;
  }

  async delete(criteria: DeleteRoleCriteria): Promise<boolean> {
    const result = await RoleModel.findOneAndDelete({
      _id: toObjectId(criteria.roleId),
      organizationId: toObjectId(criteria.organizationId),
    }).exec();

    return Boolean(result);
  }

  private toRole(record: MongoRoleRecord): Role {
    return {
      id: asRoleId(record._id.toString()),
      organizationId: asOrganizationId(record.organizationId.toString()),
      name: record.name,
      createdBy: {
        id: asUserId(record.createdBy._id.toString()),
        displayName: record.createdBy.displayName,
      },
      isSystemRole: record.isSystemRole,
      permissions: record.permissionIds.map(({ key }) => key),
      ...(record.deletedAt !== undefined && {
        deletedAt: record.deletedAt,
      }),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
