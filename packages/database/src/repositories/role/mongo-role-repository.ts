import type { Types } from "mongoose";
import { RoleModel } from "../../models/role.model.js";
import { toObjectId } from "../../utils/object-id.utils.js";
import {
  asOrganizationId,
  type OrganizationId,
} from "../organization/organization.types.js";
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

type MongoRoleRecord = {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  name: string;
  createdBy: {
    _id: Types.ObjectId;
    displayName: string;
  };
  isSystemRole: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export class MongoRoleRepository implements RoleRepository {
  async findById(roleId: RoleId): Promise<Role | null> {
    const role = await RoleModel.findOne({
      _id: toObjectId(roleId),
      deletedAt: { $exists: false },
    })
      .populate({
        path: "createdBy",
        select: "_id displayName",
      })
      .lean<MongoRoleRecord>()
      .exec();

    return role ? this.toRole(role) : null;
  }

  async findByName(organizationId: OrganizationId, name: string): Promise<Role | null> {
    const role = await RoleModel.findOne({
      organizationId: toObjectId(organizationId),
      name,
      deletedAt: { $exists: false },
    })
      .populate({
        path: "createdBy",
        select: "_id displayName",
      })
      .lean<MongoRoleRecord>()
      .exec();

    return role ? this.toRole(role) : null;
  }

  async findByOrganization(organizationId: OrganizationId): Promise<Role[]> {
    const roles = await RoleModel.find({
      organizationId: toObjectId(organizationId),
      deletedAt: { $exists: false },
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
      ...(data.isSystemRole !== undefined && {
        isSystemRole: data.isSystemRole,
      }),
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
      ...(record.deletedAt !== undefined && {
        deletedAt: record.deletedAt,
      }),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
