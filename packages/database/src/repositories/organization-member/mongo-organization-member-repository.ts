import type { Types } from "mongoose";

import OrganizationMemberModel from "../../models/organization-member.model.js";
import { toObjectId } from "../../utils/object-id.utils.js";
import {
  asOrganizationId,
  type OrganizationId,
} from "../organization/organization.types.js";

import { asRoleId } from "../role/role.types.js";

import type { ActorId } from "../user/user.types.js";
import { asUserId, type UserId } from "../user/user.types.js";

import {
  asOrganizationMemberId,
  type CreateOrganizationMemberData,
  type OrganizationMember,
  type OrganizationMemberId,
  type OrganizationMemberStatus,
  type UpdateOrganizationMemberData,
} from "./organization-member.types.js";
import type { OrganizationMemberRepository } from "./organization-member-repository.js";

type MongoOrganizationMemberRecord = {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  userId: Types.ObjectId;
  roleId: Types.ObjectId;
  status: OrganizationMemberStatus;
  createdBy: {
    _id: Types.ObjectId;
    displayName: string;
  };
  joinedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export class MongoOrganizationMemberRepository implements OrganizationMemberRepository {
  async findById(memberId: OrganizationMemberId): Promise<OrganizationMember | null> {
    const organizationMember = await OrganizationMemberModel.findOne({
      _id: toObjectId(memberId),
      deletedAt: { $exists: false },
    })
      .populate({
        path: "createdBy",
        select: "_id displayName",
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
      .populate({
        path: "createdBy",
        select: "_id displayName",
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
      .populate({
        path: "createdBy",
        select: "_id displayName",
      })
      .lean<MongoOrganizationMemberRecord[]>()
      .exec();

    return organizationMembers.map(member => this.toOrganizationMember(member));
  }

  async findAll(): Promise<OrganizationMember[]> {
    const organizationMembers = await OrganizationMemberModel.find({
      deletedAt: { $exists: false },
    })
      .populate({
        path: "createdBy",
        select: "_id displayName",
      })
      .lean<MongoOrganizationMemberRecord[]>()
      .exec();

    return organizationMembers.map(member => this.toOrganizationMember(member));
  }

  async create(
    actorId: ActorId,
    organizationId: OrganizationId,
    data: CreateOrganizationMemberData,
  ): Promise<OrganizationMember> {
    const organizationMember = await OrganizationMemberModel.create({
      organizationId: toObjectId(organizationId),
      userId: toObjectId(data.userId),
      roleId: toObjectId(data.roleId),
      createdBy: toObjectId(actorId),
    });

    const populatedOrganizationMember = await OrganizationMemberModel.findById(
      organizationMember._id,
    )
      .populate({
        path: "createdBy",
        select: "_id displayName",
      })
      .lean<MongoOrganizationMemberRecord>()
      .exec();

    if (!populatedOrganizationMember) {
      throw new Error("Organization member was created but could not be retrieved.");
    }

    return this.toOrganizationMember(populatedOrganizationMember);
  }

  async update(
    organizationId: OrganizationId,
    memberId: OrganizationMemberId,
    data: UpdateOrganizationMemberData,
  ): Promise<OrganizationMember | null> {
    const organizationMember = await OrganizationMemberModel.findOneAndUpdate(
      {
        _id: toObjectId(memberId),
        organizationId: toObjectId(organizationId),
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
      .populate({
        path: "createdBy",
        select: "_id displayName",
      })
      .lean<MongoOrganizationMemberRecord>()
      .exec();

    return organizationMember ? this.toOrganizationMember(organizationMember) : null;
  }

  async softDelete(
    organizationId: OrganizationId,
    memberId: OrganizationMemberId,
  ): Promise<OrganizationMember | null> {
    const member = await OrganizationMemberModel.findOneAndUpdate(
      {
        _id: toObjectId(memberId),
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
      .lean<MongoOrganizationMemberRecord>()
      .exec();

    return member ? this.toOrganizationMember(member) : null;
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
      createdBy: {
        id: asUserId(record.createdBy._id.toString()),
        displayName: record.createdBy.displayName,
      },
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
