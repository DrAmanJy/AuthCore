import {
  MongoApiKeyRepository,
  MongoInvitationRepository,
  MongoMemberRepository,
  MongoOrganizationRepository,
  MongoRoleRepository,
} from "@authcore/database";
import { ApiKeyService } from "./api-keys/api-key.service.js";
import { AuthorizationService } from "./authorization/authorization.service.js";
import { OrganizationService } from "./organization.service.js";
import { MembersService } from "./members/member.service.js";
import { RoleService } from "./roles/role.service.js";
import { OrganizationController } from "./organization.controller.js";
import { InvitationController } from "./invitations/invitation.controller.js";
import { InvitationService } from "./invitations/invitation.service.js";
import { MemberController } from "./members/member.controller.js";
import { RoleController } from "./roles/role.controller.js";
import { userService } from "../../container.js";
import { ApiKeyController } from "./api-keys/api-key.controller.js";

const organizationRepository = new MongoOrganizationRepository();
const memberRepository = new MongoMemberRepository();
const roleRepository = new MongoRoleRepository();
const apiKeyRepository = new MongoApiKeyRepository();
const invitationRepository = new MongoInvitationRepository();

const authorizationService = new AuthorizationService(
  organizationRepository,
  apiKeyRepository,
);

const organizationService = new OrganizationService(
  organizationRepository,
  authorizationService,
);
const apiKeyService = new ApiKeyService(apiKeyRepository, authorizationService);
const memberService = new MembersService(memberRepository, authorizationService);
const roleService = new RoleService(roleRepository, authorizationService);
const invitationService = new InvitationService(
  invitationRepository,
  userService,
  memberService,
  authorizationService,
);

const organizationController = new OrganizationController(organizationService);
const apiKeyController = new ApiKeyController(apiKeyService);
const invitationController = new InvitationController(invitationService);
const memberController = new MemberController(memberService);
const roleController = new RoleController(roleService);

export {
  memberService,
  organizationController,
  apiKeyService,
  apiKeyController,
  authorizationService,
  invitationController,
  memberController,
  roleController,
};
