import type { OrganizationStatus } from "../../models/organization.model.js";
import type { ActorId, CreatedBy } from "../user/user.types.js";

export type OrganizationId = string & {
  readonly __brand: "OrganizationId";
};

export const asOrganizationId = (id: string): OrganizationId => id as OrganizationId;

export type Organization = {
  id: OrganizationId;
  name: string;
  slug: string;
  status: OrganizationStatus;
  frontendUrl: string;
  deletedAt?: Date;
  createdBy: CreatedBy;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateOrganizationData = Pick<Organization, "name" | "slug" | "frontendUrl"> & {
  actorId: ActorId;
};

export type UpdateOrganizationData = Partial<
  Pick<Organization, "name" | "slug" | "status" | "frontendUrl">
>;

export type FindOrganizationCriteria =
  | {
      by: "id";
      organizationId: OrganizationId;
    }
  | {
      by: "slug";
      slug: string;
    };

export interface FindManyOrganizationsCriteria {
  actorId?: ActorId;
  status?: OrganizationStatus;
}

export interface UpdateOrganizationCriteria {
  organizationId: OrganizationId;
  actorId?: ActorId;
}

export interface DeleteOrganizationCriteria {
  organizationId: OrganizationId;
  actorId?: ActorId;
}

export type { OrganizationStatus };
