import type { Types } from "mongoose";
import type { IRole } from "../../models/role.model.js";
import { RoleModel } from "../../models/role.model.js";
import { toObjectId } from "../../utils/object-id.utils.js";
import {
  asOrganizationId,
  type OrganizationId,
} from "../organization/organization.types.js";
import type { FindRoleCriteria } from "./role.types.js";
import {
  asRoleId,
  type CreateRoleData,
  type Role,
  type RoleId,
  type UpdateRoleData,
} from "./role.types.js";
import type { ActorId } from "../user/user.types.js";
import { asUserId } from "../user/user.types.js";
import type { RoleRepository } from "./role-repository.js";

type MongoRoleRecord = Omit<IRole, "createdBy"> & {
  createdBy: {
    _id: Types.ObjectId;
    displayName: string;
  };
};

export class MongoRoleRepository implements RoleRepository {
  find(criteria: {
    type: "id";
    value: RoleId;
    orgId: OrganizationId;
  }): Promise<Role | null>;

  find(criteria: {
    type: "name";
    value: string;
    orgId: OrganizationId;
  }): Promise<Role | null>;

  find(criteria: { type: "organization"; value: OrganizationId }): Promise<Role[]>;
  find(criteria: { type: "all" }): Promise<Role[]>;

  async find(criteria: FindRoleCriteria): Promise<Role[] | Role | null> {
    if (criteria.type === "id" || criteria.type === "name") {
      const role = await RoleModel.findOne({
        organizationId: criteria.orgId,
        ...(criteria.type === "id" ? { _id: criteria.value } : { name: criteria.value }),
      })
        .populate({
          path: "createdBy",
          select: "_id displayName",
        })
        .lean<MongoRoleRecord>()
        .exec();
      return role ? this.toRole(role) : null;
    }

    const roles = await RoleModel.find({
      ...(criteria.type === "organization" && { organizationId: criteria.value }),
    })
      .populate({
        path: "createdBy",
        select: "_id displayName",
      })
      .lean<MongoRoleRecord[]>()
      .exec();

    return roles.map(role => this.toRole(role));
  }

  async create(
    organizationId: OrganizationId,
    actorId: ActorId,
    data: CreateRoleData,
  ): Promise<Role> {
    const role = await RoleModel.create({
      organizationId: toObjectId(organizationId),
      name: data.name,
      createdBy: toObjectId(actorId),
      permissions: data.permissions,
      isSystemRole: data.isSystemRole,
    });

    const populatedRole = await RoleModel.findById(role._id)
      .populate({
        path: "createdBy",
        select: "_id displayName",
      })
      .lean<MongoRoleRecord>()
      .exec();

    if (!populatedRole) {
      throw new Error("Role was created but could not be retrieved.");
    }

    return this.toRole(populatedRole);
  }

  async update(
    organizationId: OrganizationId,
    roleId: RoleId,
    data: UpdateRoleData,
  ): Promise<Role | null> {
    const role = await RoleModel.findOneAndUpdate(
      {
        _id: toObjectId(roleId),
        organizationId: toObjectId(organizationId),
        deletedAt: { $exists: false },
      },
      { $set: data },
      {
        new: true,
        runValidators: true,
      },
    )
      .populate({
        path: "createdBy",
        select: "_id displayName",
      })
      .lean<MongoRoleRecord>()
      .exec();

    return role ? this.toRole(role) : null;
  }

  async softDelete(organizationId: OrganizationId, roleId: RoleId): Promise<Role | null> {
    const role = await RoleModel.findOneAndUpdate(
      {
        _id: toObjectId(roleId),
        organizationId: toObjectId(organizationId),
        deletedAt: { $exists: false },
      },
      {
        $set: {
          deletedAt: new Date(),
        },
      },
      {
        new: true,
        runValidators: true,
      },
    )
      .populate({
        path: "createdBy",
        select: "_id displayName",
      })
      .lean<MongoRoleRecord>()
      .exec();

    return role ? this.toRole(role) : null;
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
      permissions: record.permissions,
      ...(record.deletedAt !== undefined && {
        deletedAt: record.deletedAt,
      }),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
