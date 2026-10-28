import type { Types } from "mongoose";

import type { IMember } from "../../models/member.model.js";
import MemberModel from "../../models/member.model.js";
import { toObjectId } from "../../utils/object-id.utils.js";
import {
  asOrganizationId,
  type OrganizationId,
} from "../organization/organization.types.js";

import { asRoleId } from "../role/role.types.js";

import type { ActorId } from "../user/user.types.js";
import { asUserId, type UserId } from "../user/user.types.js";

import type {
  Member,
  MemberId,
  UpdateMemberData,
  CreateMemberData,
  FindMemberCriteria,
} from "./organization-member.types.js";
import { asMemberId } from "./organization-member.types.js";
import type { MemberRepository } from "./organization-member-repository.js";

type MongoMemberRecord = Pick<
  IMember,
  | "_id"
  | "organizationId"
  | "userId"
  | "roleId"
  | "status"
  | "joinedAt"
  | "deletedAt"
  | "createdAt"
  | "updatedAt"
> & {
  createdBy: {
    _id: Types.ObjectId;
    displayName: string;
  };
};

export class MongoMemberRepository implements MemberRepository {
  find(criteria: {
    type: "id";
    value: MemberId;
    orgId: OrganizationId;
  }): Promise<Member | null>;

  find(criteria: {
    type: "user";
    value: UserId;
    orgId: OrganizationId;
  }): Promise<Member | null>;

  find(criteria: { type: "organization"; value: OrganizationId }): Promise<Member[]>;

  find(criteria: { type: "all" }): Promise<Member[]>;
  async find(criteria: FindMemberCriteria): Promise<Member[] | Member | null> {
    if (criteria.type === "id" || criteria.type === "user") {
      const member = await MemberModel.findOne({
        organizationId: criteria.orgId,
        ...(criteria.type === "id"
          ? { _id: toObjectId(criteria.value) }
          : { userId: criteria.value }),
      })
        .populate({
          path: "createdBy",
          select: "_id displayName",
        })
        .lean<MongoMemberRecord>()
        .exec();

      return member ? this.toMember(member) : null;
    }

    const members = await MemberModel.find({
      ...(criteria.type === "organization" && { organizationId: criteria.value }),
    })
      .populate({
        path: "createdBy",
        select: "_id displayName",
      })
      .lean<MongoMemberRecord[]>()
      .exec();

    return members.map(member => this.toMember(member));
  }

  async create(
    actorId: ActorId,
    organizationId: OrganizationId,
    data: CreateMemberData,
  ): Promise<Member> {
    const organizationMember = await MemberModel.create({
      organizationId: toObjectId(organizationId),
      userId: toObjectId(data.userId),
      roleId: toObjectId(data.roleId),
      createdBy: toObjectId(actorId),
    });

    const populatedOrganizationMember = await MemberModel.findById(organizationMember._id)
      .populate({
        path: "createdBy",
        select: "_id displayName",
      })
      .lean<MongoMemberRecord>()
      .exec();

    if (!populatedOrganizationMember) {
      throw new Error("Organization member was created but could not be retrieved.");
    }

    return this.toMember(populatedOrganizationMember);
  }

  async update(
    organizationId: OrganizationId,
    memberId: MemberId,
    data: UpdateMemberData,
  ): Promise<Member | null> {
    const organizationMember = await MemberModel.findOneAndUpdate(
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
      .lean<MongoMemberRecord>()
      .exec();

    return organizationMember ? this.toMember(organizationMember) : null;
  }

  async softDelete(
    organizationId: OrganizationId,
    memberId: MemberId,
  ): Promise<Member | null> {
    const member = await MemberModel.findOneAndUpdate(
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
      .lean<MongoMemberRecord>()
      .exec();

    return member ? this.toMember(member) : null;
  }

  private toMember(record: MongoMemberRecord): Member {
    return {
      id: asMemberId(record._id.toString()),
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
