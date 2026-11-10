import type {
  CreateRepository,
  ReadRepository,
  UpdateRepository,
} from "../repository.contracts.js";
import type {
  CreateInvitationData,
  FindManyInvitationsCriteria,
  FindInvitationCriteria,
  Invitation,
  RevokeInvitationCriteria,
  UpdateInvitationCriteria,
  UpdateInvitationData,
} from "./invitation-types.js";

export interface InvitationRepository
  extends ReadRepository<
      Invitation,
      FindInvitationCriteria,
      FindManyInvitationsCriteria
    >,
    CreateRepository<Invitation, CreateInvitationData>,
    UpdateRepository<
      Invitation,
      UpdateInvitationCriteria,
      UpdateInvitationData
    > {
  revoke(criteria: RevokeInvitationCriteria): Promise<Invitation | null>;

  findPending(criteria: FindInvitationCriteria): Promise<Invitation | null>;
}
