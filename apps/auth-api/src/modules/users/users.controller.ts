import type { Request, Response } from "express";

import type { OrganizationId } from "@authcore/database";
import { asUserId } from "@authcore/database";

import type { ChangeStatus, UpdateProfile } from "@authcore/contracts";

import type { UserService } from "./users.service.js";
import { ERROR_CODES } from "../../errors/error-codes.js";
import {
  getPaginationOptions,
  sendPaginated,
  sendSuccess,
} from "../../utils/response.utils.js";
import type { AccessTokenPayload } from "../auth/auth.types.js";
import { AppError } from "../../errors/app-error.js";
import getAuthToken from "../../utils/token.js";

type UserParams = {
  userId: string;
};

type UserRequest<TBody = unknown> = Request<UserParams, unknown, TBody>;

export class UserController {
  constructor(private readonly userService: UserService) {
    this.getUserById = this.getUserById.bind(this);
    this.getAuthenticatedUser = this.getAuthenticatedUser.bind(this);
    this.updateUserProfile = this.updateUserProfile.bind(this);
    this.deleteUser = this.deleteUser.bind(this);
    this.getAllUsers = this.getAllUsers.bind(this);
    this.getUserOrganizations = this.getUserOrganizations.bind(this);
    this.changeUserStatus = this.changeUserStatus.bind(this);
    this.deactivateUser = this.deactivateUser.bind(this);
  }

  async getUserById(req: UserRequest, res: Response) {
    const user = await this.userService.getUserById(asUserId(req.params.userId));

    sendSuccess(res, user, "User successfully retrieved");
  }

  async getAuthenticatedUser(req: Request, res: Response) {
    const { sub } = this.getAuthToken(req);

    const user = await this.userService.getUserById(sub);
    sendSuccess(res, user, "Authenticated user successfully retrieved");
  }

  async updateUserProfile(req: UserRequest<UpdateProfile>, res: Response) {
    const { sub } = this.getAuthToken(req);

    const user = await this.userService.updateProfile(sub, {
      displayName: req.body.displayName,
    });
    sendSuccess(res, user, "User profile successfully updated");
  }

  async deleteUser(req: UserRequest, res: Response) {
    const { sub } = this.getAuthToken(req);

    const user = await this.userService.deleteUser(sub);

    sendSuccess(res, user, "User successfully deleted");
  }

  async getAllUsers(req: Request, res: Response) {
    const options = getPaginationOptions(req.query);
    const users = await this.userService.getAllUsers(options);
    sendPaginated(res, users, "Users successfully retrieved");
  }

  async getUserOrganizations(req: Request, res: Response) {
    const { sub } = getAuthToken(req);
    const organizations = await this.userService.getUserOrganizations(sub);

    sendSuccess(res, organizations, "Organizations successfully retrieved");
  }
  async leaveOrganization(
    req: Request<{ organizationId: OrganizationId }>,
    res: Response,
  ) {
    const { sub } = getAuthToken(req);
    const { organizationId } = req.params;
    const member = await this.userService.leaveOrganizations(organizationId, sub);
    sendSuccess(res, member, "Organizations successfully left");
  }
  async changeUserStatus(req: UserRequest<ChangeStatus>, res: Response) {
    const user = await this.userService.changeStatus(asUserId(req.params.userId), {
      status: req.body.status,
    });
    sendSuccess(res, user, "User status successfully updated");
  }

  async deactivateUser(req: UserRequest, res: Response) {
    const { sub } = this.getAuthToken(req);
    const user = await this.userService.deactivateUser(sub);
    sendSuccess(res, user, "User successfully deactivated");
  }

  private getAuthToken(req: { token?: AccessTokenPayload }): AccessTokenPayload {
    if (!req.token) {
      throw new AppError(ERROR_CODES.AUTH_UNAUTHORIZED);
    }
    return req.token;
  }
}
