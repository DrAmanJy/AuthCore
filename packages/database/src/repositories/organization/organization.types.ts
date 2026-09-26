import type { CreatedBy } from "../user/user.types.js";

export type OrganizationId = string & {
  readonly __brand: "OrganizationId";
};

export const asOrganizationId = (id: string): OrganizationId => id as OrganizationId;

export type OrganizationStatus = "active" | "suspended" | "inactive";

export type Organization = {
  id: OrganizationId;
  name: string;
  slug: string;
  status: OrganizationStatus;
  deletedAt?: Date;
  createdBy: CreatedBy;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateOrganizationData = {
  name: string;
  slug: string;
};

export type UpdateOrganizationData = {
  name?: string;
  slug?: string;
  status?: OrganizationStatus;
};

export type FindOrganizationCriteria =
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
