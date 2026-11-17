import type {
  HardDeleteRepository,
  SoftDeleteRepository,
  StandardRepository,
} from "../repository.contracts.js";
import type {
  CreatePermissionData,
  FindManyPermissionsCriteria,
  FindPermissionCriteria,
  Permission,
  UpdatePermissionData,
} from "./permission.types.js";

export interface PermissionRepository
  extends
    StandardRepository<
      Permission,
      FindPermissionCriteria,
      FindManyPermissionsCriteria,
      CreatePermissionData,
      FindPermissionCriteria,
      UpdatePermissionData
    >,
    SoftDeleteRepository<Permission, FindPermissionCriteria>,
    HardDeleteRepository<FindPermissionCriteria> {
  findSystemPermissions(): Promise<Permission[]>;
}
