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

type Record = {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  name: string;
  isSystemRole: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export default class RoleRepository {
  async findById(roleId: RoleId): Promise<Role | null> {
    const role = await RoleModel.findById(toObjectId(roleId)).lean().exec();

    return role ? this.toRole(role) : null;
  }

  async findByName(organizationId: OrganizationId, name: string): Promise<Role | null> {
    const role = await RoleModel.findOne({
      organizationId: toObjectId(organizationId),
      name,
    })
      .lean()
      .exec();

    return role ? this.toRole(role) : null;
  }

  async findByOrganization(organizationId: OrganizationId): Promise<Role[]> {
    const roles = await RoleModel.find({ organizationId: toObjectId(organizationId) })
      .lean()
      .exec();

    return roles.map(role => this.toRole(role));
  }

  async create(data: CreateRoleData): Promise<Role> {
    const role = await RoleModel.create(data);

    return this.toRole(role);
  }

  async update(roleId: RoleId, data: UpdateRoleData): Promise<Role | null> {
    const role = await RoleModel.findByIdAndUpdate(
      toObjectId(roleId),
      { $set: data },
      { new: true, runValidators: true },
    )
      .lean()
      .exec();

    return role ? this.toRole(role) : null;
  }

  async softDelete(roleId: RoleId): Promise<Role | null> {
    const role = await RoleModel.findByIdAndUpdate(
      toObjectId(roleId),
      { $set: { deletedAt: new Date() } },
      { new: true, runValidators: true },
    )
      .lean()
      .exec();

    return role ? this.toRole(role) : null;
  }

  private toRole(record: Record): Role {
    return {
      id: asRoleId(record._id.toString()),
      organizationId: asOrganizationId(record.organizationId.toString()),
      name: record.name,
      isSystemRole: record.isSystemRole,
      ...(record.deletedAt && { deletedAt: record.deletedAt }),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
