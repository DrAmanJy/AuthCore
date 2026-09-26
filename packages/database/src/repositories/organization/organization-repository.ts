import type { UserId } from "../user/user.types.js";
import type {
  CreateOrganizationData,
  Organization,
  OrganizationId,
  UpdateOrganizationData,
} from "./organization.types.js";

export interface OrganizationRepository {
  findById(organizationId: OrganizationId): Promise<Organization | null>;

  findBySlug(slug: string): Promise<Organization | null>;

  findAll(): Promise<Organization[]>;

  findAllByUserId(userId: UserId): Promise<Organization[]>;

  create(data: CreateOrganizationData): Promise<Organization>;

  update(
    organizationId: OrganizationId,
    data: UpdateOrganizationData,
  ): Promise<Organization | null>;

  softDelete(organizationId: OrganizationId): Promise<Organization | null>;
}
