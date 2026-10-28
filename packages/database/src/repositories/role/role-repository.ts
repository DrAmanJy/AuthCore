import type { OrganizationId } from "../organization/organization.types.js";
import type { ActorId } from "../user/user.types.js";
import type { CreateRoleData, Role, RoleId, UpdateRoleData } from "./role.types.js";

export interface RoleRepository {
  find(criteria: {
    type: "id";
    value: RoleId;
    orgId: OrganizationId;
  }): Promise<Role | null>;

  find(criteria: {
    type: "name";
    value: string;
    orgId: OrganizationId;
  }): Promise<Role | null>;

  find(criteria: { type: "organization"; value: OrganizationId }): Promise<Role[]>;
  find(criteria: { type: "all" }): Promise<Role[]>;

  create(
    organizationId: OrganizationId,
    actorId: ActorId,
    data: CreateRoleData,
  ): Promise<Role>;

  update(
    organizationId: OrganizationId,
    roleId: RoleId,
    data: UpdateRoleData,
  ): Promise<Role | null>;

  softDelete(organizationId: OrganizationId, roleId: RoleId): Promise<Role | null>;
}
