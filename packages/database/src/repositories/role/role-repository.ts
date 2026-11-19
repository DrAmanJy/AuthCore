import type { PermissionId } from "../permission/permission.types.js";
import type {
  HardDeleteRepository,
  SoftDeleteRepository,
  StandardRepository,
} from "../repository.contracts.js";
import type {
  CreateRoleData,
  FindManyRolesCriteria,
  FindRoleCriteria,
  Role,
  UpdateRoleData,
} from "./role.types.js";

export interface RoleRepository
  extends
    StandardRepository<
      Role,
      FindRoleCriteria,
      FindManyRolesCriteria,
      CreateRoleData,
      FindRoleCriteria,
      UpdateRoleData
    >,
    SoftDeleteRepository<Role, FindRoleCriteria>,
    HardDeleteRepository<FindRoleCriteria> {
  createSystemRole(data: CreateRoleData): Promise<Role | null>;
  addPermissions(
    criteria: FindRoleCriteria,
    permissions: PermissionId[],
  ): Promise<Role | null>;
  removePermissions(
    criteria: FindRoleCriteria,
    permissions: PermissionId[],
  ): Promise<Role | null>;
}
