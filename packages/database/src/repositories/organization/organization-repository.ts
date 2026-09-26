import type { ActorId } from "../user/user.types.js";
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

  findAllByActorId(actorId: ActorId): Promise<Organization[]>;

  create(actorId: ActorId, data: CreateOrganizationData): Promise<Organization>;

  update(
    organizationId: OrganizationId,
    actorId: ActorId,
    data: UpdateOrganizationData,
  ): Promise<Organization | null>;

  softDelete(
    organizationId: OrganizationId,
    actorId: ActorId,
  ): Promise<Organization | null>;
}
