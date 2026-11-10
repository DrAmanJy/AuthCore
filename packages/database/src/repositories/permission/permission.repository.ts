import type { OrganizationId } from "../organization/organization.types.js";
import type {
  HardDeleteRepository,
  SoftDeleteRepository,
  StandardRepository,
} from "../repository.contracts.js";
import type {
  CreatePermissionData,
  DeletePermissionCriteria,
  FindManyPermissionsCriteria,
  FindPermissionCriteria,
  Permission,
  UpdatePermissionCriteria,
  UpdatePermissionData,
} from "./permission.types.js";

export interface PermissionRepository
  extends
    StandardRepository<
      Permission,
      FindPermissionCriteria,
      FindManyPermissionsCriteria,
      CreatePermissionData,
      UpdatePermissionCriteria,
      UpdatePermissionData
    >,
    SoftDeleteRepository<Permission, DeletePermissionCriteria>,
    HardDeleteRepository<DeletePermissionCriteria> {
  findSystemPermissions(organizationId: OrganizationId): Promise<Permission[]>;
}
