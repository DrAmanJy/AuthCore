import type { QueryFilter, Types } from "mongoose";
import type { IPermission } from "../../models/permission.model.js";
import type { IRole } from "../../models/role.model.js";
import { RoleModel } from "../../models/role.model.js";
import { toObjectId } from "../../utils/object-id.utils.js";
import { asOrganizationId } from "../organization/organization.types.js";
import type { FindManyOptions, PaginatedResult } from "../repository-pagination.types.js";
import { asUserId } from "../user/user.types.js";
import type { RoleRepository } from "./role-repository.js";
import {
  asRoleId,
  type CreateRoleData,
  type FindManyRolesCriteria,
  type FindRoleCriteria,
  type Role,
  type UpdateRoleData,
} from "./role.types.js";
import type { PermissionId } from "../permission/permission.types.js";
import PermissionModel from "../../models/permission.model.js";

type MongoRoleRecord = Omit<IRole, "createdBy" | "permissionIds"> & {
  createdBy: {
    _id: Types.ObjectId;
    displayName: string;
  };
  permissionIds: Pick<IPermission, "_id" | "key">[];
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

  async create(data: CreateRoleData): Promise<Role> {
    const permissionIds = [...new Set(data.permissionIds.map(id => id.toString()))].map(
      toObjectId,
    );

    const validPermissions = await PermissionModel.countDocuments({
      _id: { $in: permissionIds },
      deletedAt: { $exists: false },
      $or: [{ scope: "system" }, { organizationId: toObjectId(data.organizationId) }],
    });

    if (validPermissions !== permissionIds.length) {
      throw new Error("Some permissions are invalid.");
    }

    const role = await RoleModel.create({
      organizationId: toObjectId(data.organizationId),
      name: data.name,
      permissionIds,
      createdBy: toObjectId(data.createdBy),
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

  async createSystemRole(data: CreateRoleData): Promise<Role | null> {
    const permissionIds = [...new Set(data.permissionIds.map(id => id.toString()))].map(
      toObjectId,
    );

    const validPermissions = await PermissionModel.countDocuments({
      _id: { $in: permissionIds },
      deletedAt: { $exists: false },
      $or: [{ scope: "system" }, { organizationId: toObjectId(data.organizationId) }],
    });

    if (validPermissions !== permissionIds.length) {
      throw new Error("Some permissions are invalid.");
    }
    const role = await RoleModel.create({
      organizationId: toObjectId(data.organizationId),
      name: data.name,
      permissionIds,
      createdBy: toObjectId(data.createdBy),
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

  async update(criteria: FindRoleCriteria, data: UpdateRoleData): Promise<Role | null> {
    const role = await RoleModel.findOneAndUpdate(
      {
        ...(criteria.by === "id"
          ? { _id: toObjectId(criteria.roleId) }
          : { name: criteria.name }),
        organizationId: toObjectId(criteria.organizationId),
        deletedAt: { $exists: false },
      },
      data,
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

  async addPermissions(
    criteria: FindRoleCriteria,
    permissions: PermissionId[],
  ): Promise<Role | null> {
    const permissionIds = permissions.map(permission => toObjectId(permission));

    const validPermissions = await PermissionModel.countDocuments({
      _id: { $in: permissionIds },
      deletedAt: { $exists: false },
      $or: [{ scope: "system" }, { organizationId: toObjectId(criteria.organizationId) }],
    });

    if (validPermissions !== permissionIds.length) {
      throw new Error("Some permissions are invalid.");
    }

    const role = await RoleModel.findOneAndUpdate(
      {
        ...(criteria.by === "id"
          ? { _id: toObjectId(criteria.roleId) }
          : { name: criteria.name }),
        organizationId: toObjectId(criteria.organizationId),
        deletedAt: { $exists: false },
      },
      {
        $addToSet: {
          permissionIds: {
            $each: permissionIds,
          },
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

  async removePermissions(
    criteria: FindRoleCriteria,
    permissions: PermissionId[],
  ): Promise<Role | null> {
    const permissionIds = permissions.map(permission => toObjectId(permission));

    const role = await RoleModel.findOneAndUpdate(
      {
        ...(criteria.by === "id"
          ? { _id: toObjectId(criteria.roleId) }
          : { name: criteria.name }),
        organizationId: toObjectId(criteria.organizationId),
        deletedAt: { $exists: false },
      },
      {
        $pull: {
          permissionIds: {
            $in: permissionIds,
          },
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

  async softDelete(criteria: FindRoleCriteria): Promise<Role | null> {
    const role = await RoleModel.findOneAndUpdate(
      {
        ...(criteria.by === "id"
          ? { _id: toObjectId(criteria.roleId) }
          : { name: criteria.name }),
        organizationId: toObjectId(criteria.organizationId),
        deletedAt: { $exists: false },
        systemKey: { $exists: false },
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

  async delete(criteria: FindRoleCriteria): Promise<boolean> {
    const result = await RoleModel.findOneAndDelete({
      ...(criteria.by === "id"
        ? { _id: toObjectId(criteria.roleId) }
        : { name: criteria.name }),
      organizationId: toObjectId(criteria.organizationId),
      deletedAt: { $exists: true },
      systemKey: { $exists: false },
    }).exec();

    return Boolean(result);
  }

  private toRole(record: MongoRoleRecord): Role {
    return {
      id: asRoleId(record._id.toString()),
      organizationId: asOrganizationId(record.organizationId.toString()),
      name: record.name,
      permissions: record.permissionIds.map(({ key }) => key),
      createdBy: {
        id: asUserId(record.createdBy._id.toString()),
        displayName: record.createdBy.displayName,
      },

      ...(record.deletedAt !== undefined && {
        deletedAt: record.deletedAt,
      }),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
