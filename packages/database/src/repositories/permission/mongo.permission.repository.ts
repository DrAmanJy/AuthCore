import type { IPermissions } from "../../models/permission.model.js";
import PermissionModel from "../../models/permission.model.js";
import { toObjectId } from "../../utils/object-id.utils.js";
import type { OrganizationId } from "../organization/organization.types.js";
import { asRoleId } from "../role/role.types.js";
import type { ActorId, CreatedBy } from "../user/user.types.js";
import type { PermissionRepository } from "./permission.repository.js";
import {
  asPermissionId,
  type CreatePermission,
  type Permission,
  type PermissionId,
  type UpdatePermission,
} from "./permission.types.js";

type PermissionRecord = IPermissions & {
  createdBy: CreatedBy;
};

export class MongoPermissionRepository implements PermissionRepository {
  async find(
    organizationId: OrganizationId,
    permissionId: PermissionId,
  ): Promise<Permission | null> {
    const permission = await PermissionModel.findOne({
      _id: toObjectId(permissionId),
      organizationId: toObjectId(organizationId),
      deletedAt: { $exists: false },
    })
      .populate({
        path: "createdBy",
        select: "_id displayName",
      })
      .lean<PermissionRecord>()
      .exec();

    return permission ? this.toPermission(permission) : null;
  }
  async create(
    organizationId: OrganizationId,
    data: CreatePermission,
    actorId: ActorId,
  ): Promise<Permission | null> {
    const permission = await PermissionModel.create({
      createdBy: actorId,
      organizationId,
      ...data,
    });
    const PermissionRecord = await PermissionModel.findById(permission.id)
      .populate({
        path: "createdBy",
        select: "_id displayName",
      })
      .lean<PermissionRecord>()
      .exec();

    return PermissionRecord ? this.toPermission(PermissionRecord) : null;
  }

  async update(
    organizationId: OrganizationId,
    permissionId: PermissionId,
    data: UpdatePermission,
  ): Promise<Permission | null> {
    const permission = await PermissionModel.findOneAndUpdate(
      {
        _id: toObjectId(permissionId),
        organizationId: toObjectId(organizationId),
        deletedAt: { $exists: false },
      },
      data,
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

  async softDelete(
    organizationId: OrganizationId,
    permissionId: PermissionId,
  ): Promise<Permission | null> {
    const permission = await PermissionModel.findOneAndUpdate(
      {
        _id: toObjectId(permissionId),
        organizationId: toObjectId(organizationId),
        deletedAt: { $exists: false },
      },
      {
        $currentDate: { deletedAt: true },
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

  async delete(
    organizationId: OrganizationId,
    permissionId: PermissionId,
  ): Promise<Permission | null> {
    const permission = await PermissionModel.findOneAndDelete({
      _id: toObjectId(permissionId),
      organizationId: toObjectId(organizationId),
      deletedAt: { $exists: false },
    })
      .populate({
        path: "createdBy",
        select: "_id displayName",
      })
      .lean<PermissionRecord>()
      .exec();

    return permission ? this.toPermission(permission) : null;
  }

  toPermission(record: PermissionRecord): Permission {
    return {
      id: asPermissionId(record._id.toString()),
      key: record.key,
      description: record.description,
      roleId: asRoleId(record.roleId.toString()),
      ...(record.deletedAt && { deletedAt: record.deletedAt }),
      createdBy: record.createdBy,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
