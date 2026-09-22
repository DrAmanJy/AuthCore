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

type MongoOrganizationRecord = {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  status: OrganizationStatus;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export default class MongoOrganizationRepository {
  async findById(organizationId: OrganizationId): Promise<Organization | null> {
    const organization = await OrganizationModel.findOne({
      _id: toObjectId(organizationId),
      deletedAt: { $exists: false },
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
      .lean<MongoOrganizationRecord>()
      .exec();

    return organization ? this.toOrganization(organization) : null;
  }

  async findAll(): Promise<Organization[]> {
    const organizations = await OrganizationModel.find({
      deletedAt: { $exists: false },
    })
      .lean<MongoOrganizationRecord[]>()
      .exec();

    return organizations.map(organization => this.toOrganization(organization));
  }

  async create(data: CreateOrganizationData): Promise<Organization> {
    const organization = await OrganizationModel.create(data);

    return this.toOrganization(organization);
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
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
