import type { Types } from "mongoose";

import OrganizationMemberModel from "../../models/organization-member.model.js";
import { toObjectId } from "../../utils/object-id.utils.js";
import {
  asOrganizationId,
  type OrganizationId,
} from "../organization/organization.types.js";

import { asRoleId } from "../role/role.types.js";

import { asUserId, type UserId } from "../user/user.types.js";

import {
  asOrganizationMemberId,
  type CreateOrganizationMemberData,
  type OrganizationMember,
  type OrganizationMemberId,
  type OrganizationMemberStatus,
  type UpdateOrganizationMemberData,
} from "./organization-member.types.js";

type MongoOrganizationMemberRecord = {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  userId: Types.ObjectId;
  roleId: Types.ObjectId;
  status: OrganizationMemberStatus;
  joinedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export class MongoOrganizationMemberRepository {
  async findById(memberId: OrganizationMemberId): Promise<OrganizationMember | null> {
    const organizationMember = await OrganizationMemberModel.findOne({
      _id: toObjectId(memberId),
      deletedAt: { $exists: false },
    })
      .lean<MongoOrganizationMemberRecord>()
      .exec();

    return organizationMember ? this.toOrganizationMember(organizationMember) : null;
  }

  async findByUser(
    userId: UserId,
    organizationId: OrganizationId,
  ): Promise<OrganizationMember | null> {
    const organizationMember = await OrganizationMemberModel.findOne({
      userId: toObjectId(userId),
      organizationId: toObjectId(organizationId),
      deletedAt: { $exists: false },
    })
      .lean<MongoOrganizationMemberRecord>()
      .exec();

    return organizationMember ? this.toOrganizationMember(organizationMember) : null;
  }

  async findByOrganization(
    organizationId: OrganizationId,
  ): Promise<OrganizationMember[]> {
    const organizationMembers = await OrganizationMemberModel.find({
      organizationId: toObjectId(organizationId),
      deletedAt: { $exists: false },
    })
      .lean<MongoOrganizationMemberRecord[]>()
      .exec();

    return organizationMembers.map(member => this.toOrganizationMember(member));
  }

  async findAll(): Promise<OrganizationMember[]> {
    const organizationMembers = await OrganizationMemberModel.find({
      deletedAt: { $exists: false },
    })
      .lean<MongoOrganizationMemberRecord[]>()
      .exec();

    return organizationMembers.map(member => this.toOrganizationMember(member));
  }

  async create(data: CreateOrganizationMemberData): Promise<OrganizationMember> {
    const organizationMember = await OrganizationMemberModel.create({
      organizationId: toObjectId(data.organizationId),
      userId: toObjectId(data.userId),
      roleId: toObjectId(data.roleId),
      ...(data.status !== undefined && {
        status: data.status,
      }),
    });

    return this.toOrganizationMember(organizationMember);
  }

  async update(
    memberId: OrganizationMemberId,
    data: UpdateOrganizationMemberData,
  ): Promise<OrganizationMember | null> {
    const organizationMember = await OrganizationMemberModel.findOneAndUpdate(
      {
        _id: toObjectId(memberId),
        deletedAt: { $exists: false },
      },
      {
        $set: data,
      },
      {
        new: true,
        runValidators: true,
      },
    )
      .lean<MongoOrganizationMemberRecord>()
      .exec();

    return organizationMember ? this.toOrganizationMember(organizationMember) : null;
  }

  async remove(memberId: OrganizationMemberId): Promise<OrganizationMember | null> {
    const organizationMember = await OrganizationMemberModel.findOneAndUpdate(
      {
        _id: toObjectId(memberId),
        deletedAt: { $exists: false },
      },
      {
        $set: {
          status: "removed",
          deletedAt: new Date(),
        },
      },
      {
        new: true,
        runValidators: true,
      },
    )
      .lean<MongoOrganizationMemberRecord>()
      .exec();

    return organizationMember ? this.toOrganizationMember(organizationMember) : null;
  }

  private toOrganizationMember(
    record: MongoOrganizationMemberRecord,
  ): OrganizationMember {
    return {
      id: asOrganizationMemberId(record._id.toString()),
      organizationId: asOrganizationId(record.organizationId.toString()),
      userId: asUserId(record.userId.toString()),
      roleId: asRoleId(record.roleId.toString()),
      status: record.status,
      ...(record.joinedAt !== undefined && {
        joinedAt: record.joinedAt,
      }),
      ...(record.deletedAt !== undefined && {
        deletedAt: record.deletedAt,
      }),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
