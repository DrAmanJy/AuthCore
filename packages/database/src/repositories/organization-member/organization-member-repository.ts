import type { OrganizationId } from "../organization/organization.types.js";
import type {
  HardDeleteRepository,
  SoftDeleteRepository,
  StandardRepository,
} from "../repository.contracts.js";
import type {
  CreateMemberData,
  DeleteMemberCriteria,
  FindManyMembersCriteria,
  FindMemberCriteria,
  Member,
  UpdateMemberCriteria,
  UpdateMemberData,
} from "./organization-member.types.js";

export interface MemberRepository
  extends
    StandardRepository<
      Member,
      FindMemberCriteria,
      FindManyMembersCriteria,
      CreateMemberData,
      UpdateMemberCriteria,
      UpdateMemberData
    >,
    SoftDeleteRepository<Member, DeleteMemberCriteria>,
    HardDeleteRepository<DeleteMemberCriteria> {
  findOwners(organizationId: OrganizationId): Promise<Member[]>;
}
