import type { OrganizationId } from "../organization/organization.types.js";
import type { CreateRoleData, Role, RoleId, UpdateRoleData } from "./role.types.js";

export interface RoleRepository {
  findById(roleId: RoleId): Promise<Role | null>;

  findByName(organizationId: OrganizationId, name: string): Promise<Role | null>;

  findByOrganization(organizationId: OrganizationId): Promise<Role[]>;

  create(data: CreateRoleData): Promise<Role>;

  update(roleId: RoleId, data: UpdateRoleData): Promise<Role | null>;

  softDelete(roleId: RoleId): Promise<Role | null>;
}
