import type { OrganizationId } from "../organization/organization.types.js";
import type { ActorId } from "../user/user.types.js";
import type {
  CreatePermission,
  Permission,
  PermissionId,
  UpdatePermission,
} from "./permission.types.js";

export interface PermissionRepository {
  find(
    organizationId: OrganizationId,
    permissionId: PermissionId,
  ): Promise<Permission | null>;
  create(
    organizationId: OrganizationId,
    data: CreatePermission,
    actorId: ActorId,
  ): Promise<Permission | null>;
  update(
    organizationId: OrganizationId,
    permissionId: PermissionId,
    data: UpdatePermission,
  ): Promise<Permission | null>;
  softDelete(
    organizationId: OrganizationId,
    permissionId: PermissionId,
  ): Promise<Permission | null>;
  delete(
    organizationId: OrganizationId,
    permissionId: PermissionId,
  ): Promise<Permission | null>;
}
