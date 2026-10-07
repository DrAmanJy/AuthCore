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
  redirectUrl: string;
  deletedAt?: Date;
  createdBy: CreatedBy;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateOrganizationData = Pick<Organization, "name" | "slug" | "redirectUrl">;

export type UpdateOrganizationData = Partial<
  Pick<Organization, "name" | "slug" | "status" | "redirectUrl">
>;

export type FindOrganizationCriteria =
  | {
      type: "all";
    }
  | {
      type: "actor";
      value: ActorId;
    }
  | {
      type: "id";
      value: OrganizationId;
    }
  | {
      type: "slug";
      value: string;
    };

export type DeleteOrganizationCriteria =
  | {
      type: "id";
      value: OrganizationId;
    }
  | {
      type: "slug";
      value: string;
    };
