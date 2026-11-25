import type {
  CreateMemberData,
  MemberId,
  OrganizationId,
  RoleId,
  UserId,
} from "@authcore/database";
import getAuthToken from "../../../utils/token.js";
import type { MembersService } from "./member.service.js";
import {
  getPaginationOptions,
  sendCreated,
  sendPaginated,
  sendSuccess,
} from "../../../utils/response.utils.js";
import type { Request, Response } from "express";
import { AppError } from "../../../errors/app-error.js";
import { ERROR_CODES } from "../../../errors/error-codes.js";

export class MemberController {
  constructor(private readonly membersService: MembersService) {
    this.transferOwnership = this.transferOwnership.bind(this);
    this.getMembers = this.getMembers.bind(this);
    this.createMember = this.createMember.bind(this);
    this.getMember = this.getMember.bind(this);
    this.changeRole = this.changeRole.bind(this);
    this.activateMember = this.activateMember.bind(this);
    this.suspendMember = this.suspendMember.bind(this);
    this.removeMember = this.removeMember.bind(this);
  }

  async transferOwnership(
    req: Request<unknown, unknown, { newOwnerUserId: UserId }>,
    res: Response,
  ) {
    const { sub } = getAuthToken(req);
    if (!req.orgContext) throw new AppError("AUTH_FORBIDDEN");
    const { organization } = req.orgContext;
    const { newOwnerUserId } = req.body;

    const result = await this.membersService.transferOwnership(
      organization,
      sub,
      newOwnerUserId,
    );

    sendSuccess(res, result, "Organization ownership transferred successfully");
  }

  async getMembers(req: Request<{ organizationId: OrganizationId }>, res: Response) {
    const { sub } = getAuthToken(req);
    const { organizationId } = req.params;

    if (!organizationId) {
      throw new AppError(ERROR_CODES.VALIDATION_FAILED);
    }
    const options = getPaginationOptions(req.query);
    const members = await this.membersService.getMembers(organizationId, options, sub);

    sendPaginated(res, members, "Organization Members successfully retrieved");
  }

  async createMember(
    req: Request<{ organizationId: OrganizationId }, unknown, CreateMemberData>,
    res: Response,
  ) {
    const { sub } = getAuthToken(req);
    const { organizationId } = req.params;
    const { roleId, userId } = req.body;

    if (!organizationId) {
      throw new AppError(ERROR_CODES.VALIDATION_FAILED);
    }
    const member = await this.membersService.addMember({
      organizationId,
      userId,
      actorId: sub,
      roleId,
      status: "invited",
    });

    sendCreated(res, member, "Organization Member successfully created");
  }

  async getMember(
    req: Request<{ organizationId: OrganizationId; memberId: MemberId }>,
    res: Response,
  ) {
    const { sub } = getAuthToken(req);
    const { organizationId, memberId } = req.params;

    if (!organizationId || !memberId) {
      throw new AppError(ERROR_CODES.VALIDATION_FAILED);
    }
    const member = await this.membersService.getMember(organizationId, memberId, sub);

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
      throw new AppError(ERROR_CODES.VALIDATION_FAILED);
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
      throw new AppError(ERROR_CODES.VALIDATION_FAILED);
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
      throw new AppError(ERROR_CODES.VALIDATION_FAILED);
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
      throw new AppError(ERROR_CODES.VALIDATION_FAILED);
    }
    const member = await this.membersService.removeMember(organizationId, memberId, sub);

    sendSuccess(res, member, "Organization Member successfully removed");
  }
}
