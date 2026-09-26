import type { Types } from "mongoose";

import OrganizationModel from "../../models/organization.model.js";
import { toObjectId } from "../../utils/object-id.utils.js";

import {
  asOrganizationId,
  type CreateOrganizationData,
  type Organization,
  type OrganizationId,
  type OrganizationStatus,
  type UpdateOrganizationData,
} from "./organization.types.js";
import { asUserId, type UserId } from "../user/user.types.js";
import type { OrganizationRepository } from "./organization-repository.js";

type MongoOrganizationRecord = {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  status: OrganizationStatus;
  createdBy: {
    _id: Types.ObjectId;
    displayname: string;
  };
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export class MongoOrganizationRepository implements OrganizationRepository {
  async findById(organizationId: OrganizationId): Promise<Organization | null> {
    const organization = await OrganizationModel.findOne({
      _id: toObjectId(organizationId),
      deletedAt: { $exists: false },
    })
      .populate({
        path: "createdBy",
        select: "_id displayname",
      })
      .lean<MongoOrganizationRecord>()
      .exec();

    return organization ? this.toOrganization(organization) : null;
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    const organization = await OrganizationModel.findOne({
      slug,
      deletedAt: { $exists: false },
    })
      .populate({
        path: "createdBy",
        select: "_id displayname",
      })
      .lean<MongoOrganizationRecord>()
      .exec();

    return organization ? this.toOrganization(organization) : null;
  }

  async findAll(): Promise<Organization[]> {
    const organizations = await OrganizationModel.find({
      deletedAt: { $exists: false },
    })
      .populate({
        path: "createdBy",
        select: "_id displayname",
      })
      .lean<MongoOrganizationRecord[]>()
      .exec();

    return organizations.map(organization => this.toOrganization(organization));
  }

  async findAllByUserId(userId: UserId): Promise<Organization[]> {
    const organizations = await OrganizationModel.find({
      createdBy: toObjectId(userId),
      deletedAt: { $exists: false },
    })
      .populate({
        path: "createdBy",
        select: "_id displayname",
      })
      .lean<MongoOrganizationRecord[]>()
      .exec();

    return organizations.map(organization => this.toOrganization(organization));
  }

  async create(data: CreateOrganizationData): Promise<Organization> {
    const organization = await OrganizationModel.create(data);

    const populatedOrganization = await OrganizationModel.findById(organization._id)
      .populate({
        path: "createdBy",
        select: "_id displayname",
      })
      .lean<MongoOrganizationRecord>()
      .exec();

    if (!populatedOrganization) {
      throw new Error("Organization was created but could not be retrieved.");
    }

    return this.toOrganization(populatedOrganization);
  }

  async update(
    organizationId: OrganizationId,
    data: UpdateOrganizationData,
  ): Promise<Organization | null> {
    const update: Partial<UpdateOrganizationData> = {};

    if (data.name !== undefined) {
      update.name = data.name;
    }

    if (data.slug !== undefined) {
      update.slug = data.slug;
    }

    if (data.status !== undefined) {
      update.status = data.status;
    }

    const organization = await OrganizationModel.findOneAndUpdate(
      {
        _id: toObjectId(organizationId),
        deletedAt: { $exists: false },
      },
      {
        $set: update,
      },
      {
        new: true,
        runValidators: true,
      },
    )
      .populate({
        path: "createdBy",
        select: "_id displayname",
      })
      .lean<MongoOrganizationRecord>()
      .exec();

    return organization ? this.toOrganization(organization) : null;
  }

  async softDelete(organizationId: OrganizationId): Promise<Organization | null> {
    const organization = await OrganizationModel.findOneAndUpdate(
      {
        _id: toObjectId(organizationId),
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
        select: "_id displayname",
      })
      .lean<MongoOrganizationRecord>()
      .exec();

    return organization ? this.toOrganization(organization) : null;
  }

  private toOrganization(record: MongoOrganizationRecord): Organization {
    return {
      id: asOrganizationId(record._id.toString()),
      name: record.name,
      slug: record.slug,
      status: record.status,
      ...(record.deletedAt !== undefined && {
        deletedAt: record.deletedAt,
      }),

      createdBy: {
        id: asUserId(record.createdBy._id.toString()),
        displayname: record.createdBy.displayname,
      },
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
