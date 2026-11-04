import type { OrganizationId } from "../organization/organization.types.js";
import type {
  HardDeleteRepository,
  SoftDeleteRepository,
  StandardRepository,
} from "../repository.contracts.js";
import type {
  CreateRoleData,
  DeleteRoleCriteria,
  FindManyRolesCriteria,
  FindRoleCriteria,
  Role,
  UpdateRoleCriteria,
  UpdateRoleData,
} from "./role.types.js";

export interface RoleRepository
  extends
    StandardRepository<
      Role,
      FindRoleCriteria,
      FindManyRolesCriteria,
      CreateRoleData,
      UpdateRoleCriteria,
      UpdateRoleData
    >,
    SoftDeleteRepository<Role, DeleteRoleCriteria>,
    HardDeleteRepository<DeleteRoleCriteria> {
  findDefault(organizationId: OrganizationId): Promise<Role | null>;
}
