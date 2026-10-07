import type { ActorId } from "../user/user.types.js";
import type {
  CreateOrganizationData,
  DeleteOrganizationCriteria,
  Organization,
  OrganizationId,
  UpdateOrganizationData,
} from "./organization.types.js";

export interface OrganizationRepository {
  find(criteria: { type: "all" }): Promise<Organization[]>;

  find(criteria: { type: "actor"; value: ActorId }): Promise<Organization[]>;

  find(criteria: { type: "id"; value: OrganizationId }): Promise<Organization | null>;

  find(criteria: { type: "slug"; value: string }): Promise<Organization | null>;

  create(actorId: ActorId, data: CreateOrganizationData): Promise<Organization>;

  update(
    organizationId: OrganizationId,
    actorId: ActorId,
    data: UpdateOrganizationData,
  ): Promise<Organization | null>;

  softDelete(
    criteria: DeleteOrganizationCriteria,
    actorId: ActorId,
  ): Promise<Organization | null>;
}
