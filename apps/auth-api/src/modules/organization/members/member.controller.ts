import type {
  CreateMemberData,
  MemberId,
  OrganizationId,
  RoleId,
} from "@authcore/database";
import getAuthToken from "../../../utils/token.js";
import type { MembersService } from "./member.service.js";
import { sendCreated, sendSuccess } from "../../../utils/response.utils.js";
import type { Request, Response } from "express";

export class MemberController {
  constructor(private readonly membersService: MembersService) {
    this.getMembers = this.getMembers.bind(this);
    this.createMember = this.createMember.bind(this);
    this.getMember = this.getMember.bind(this);
    this.changeRole = this.changeRole.bind(this);
    this.activateMember = this.activateMember.bind(this);
    this.suspendMember = this.suspendMember.bind(this);
    this.removeMember = this.removeMember.bind(this);
  }

  //   async transferOwnership(req: Request<{ newOwnerUserId: string }>, res: Response) {
  //     const { sub } = getAuthToken(req);
  //     const organization = await this.membersService.transferOwnership(
  //       asOrganizationId(req.params.organizationId),
  //       asActorId(sub),
  //       asUserId(req.body.newOwnerUserId),
  //     );

  //     sendSuccess(res, organization, "Organization ownership transferred successfully");
  //   }

  async getMembers(req: Request<{ organizationId: OrganizationId }>, res: Response) {
    const { organizationId } = req.params;

    if (!organizationId) {
      throw new Error("change at L10");
    }
    const members = await this.membersService.getMembers(organizationId);

    sendSuccess(res, members, "Organization Members successfully retrieved");
  }

  async createMember(
    req: Request<{ organizationId: OrganizationId }, unknown, CreateMemberData>,
    res: Response,
  ) {
    const { sub } = getAuthToken(req);
    const { organizationId } = req.params;
    const { roleId, userId } = req.body;

    if (!organizationId) {
      throw new Error("change at L10");
    }
    const member = await this.membersService.addMember(organizationId, sub, {
      roleId,
      userId,
    });

    sendCreated(res, member, "Organization Member successfully created");
  }

  async getMember(
    req: Request<{ organizationId: OrganizationId; memberId: MemberId }>,
    res: Response,
  ) {
    const { organizationId, memberId } = req.params;

    if (!organizationId || !memberId) {
      throw new Error("change at L10");
    }
    const member = await this.membersService.getMember(organizationId, memberId);

    sendSuccess(res, member, "Organization Member successfully retrieved");
  }

  async changeRole(
    req: Request<
      { organizationId: OrganizationId; memberId: MemberId },
      unknown,
      { roleId: RoleId }
    >,
    res: Response,
  ) {
    const { sub } = getAuthToken(req);
    const { organizationId, memberId } = req.params;
    const { roleId } = req.body;

    if (!organizationId || !memberId) {
      throw new Error("change at L10");
    }
    const member = await this.membersService.changeRole(
      req.params.organizationId,
      req.params.memberId,
      sub,
      roleId,
    );

    sendSuccess(res, member, "Organization Member successfully updated");
  }

  async activateMember(
    req: Request<{ organizationId: OrganizationId; memberId: MemberId }>,
    res: Response,
  ) {
    const { sub } = getAuthToken(req);
    const { organizationId, memberId } = req.params;

    if (!organizationId || !memberId) {
      throw new Error("change at L10");
    }
    const member = await this.membersService.activateMember(
      organizationId,
      memberId,
      sub,
    );

    sendSuccess(res, member, "Organization Member successfully activated");
  }

  async suspendMember(
    req: Request<{ organizationId: OrganizationId; memberId: MemberId }>,
    res: Response,
  ) {
    const { sub } = getAuthToken(req);
    const { organizationId, memberId } = req.params;

    if (!organizationId || !memberId) {
      throw new Error("change at L10");
    }
    const member = await this.membersService.suspendMember(organizationId, memberId, sub);

    sendSuccess(res, member, "Organization Member successfully suspended");
  }

  async removeMember(
    req: Request<{ organizationId: OrganizationId; memberId: MemberId }>,
    res: Response,
  ) {
    const { sub } = getAuthToken(req);
    const { organizationId, memberId } = req.params;

    if (!organizationId || !memberId) {
      throw new Error("change at L10");
    }
    const member = await this.membersService.removeMember(organizationId, memberId, sub);

    sendSuccess(res, member, "Organization Member successfully removed");
  }
}
