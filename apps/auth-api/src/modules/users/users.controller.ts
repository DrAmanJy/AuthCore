import type { Request, Response } from "express";
import { asUserId } from "@authcore/database";

import type { UserService } from "./users.service.js";

export class UserController {
  constructor(private readonly userService: UserService) {}

  async getUserById(req: Request, res: Response) {
    const { userId } = req.params;

    if (typeof userId !== "string") {
      return; // TODO: throw BadRequestError
    }

    const user = await this.userService.getUserById(asUserId(userId));

    return res.status(200).json({
      message: "User retrieved successfully",
      data: {
        user,
      },
    });
  }

  async getAuthenticatedUser(req: Request, res: Response) {
    const { userId } = req.user;

    const user = await this.userService.getUserById(asUserId(userId));

    return res.status(200).json({
      message: "Authenticated user retrieved successfully",
      data: {
        user,
      },
    });
  }

  async updateUserProfile(req: Request, res: Response) {
    const { userId } = req.params;
    const { displayName } = req.body;

    if (typeof userId !== "string") {
      return; // TODO: throw BadRequestError
    }

    const user = await this.userService.updateProfile(asUserId(userId), {
      displayName,
    });

    return res.status(200).json({
      message: "User profile updated successfully",
      data: {
        user,
      },
    });
  }

  async updateUserEmail(req: Request, res: Response) {
    const { userId } = req.params;
    const { email } = req.body;

    if (typeof userId !== "string") {
      return; // TODO: throw BadRequestError
    }

    const user = await this.userService.changeEmail(asUserId(userId), {
      email,
    });

    return res.status(200).json({
      message: "User email updated successfully",
      data: {
        user,
      },
    });
  }

  async deleteUser(req: Request, res: Response) {
    const { userId } = req.params;

    if (typeof userId !== "string") {
      return; // TODO: throw BadRequestError
    }

    await this.userService.deleteUser(asUserId(userId));

    return res.status(200).json({
      message: "User deleted successfully",
    });
  }

  async getAllUsers(req: Request, res: Response) {
    const users = await this.userService.getAllUsers();

    return res.status(200).json({
      message: "Users retrieved successfully",
      data: {
        users,
      },
    });
  }

  async changeUserStatus(req: Request, res: Response) {
    const { userId } = req.params;
    const { status } = req.body;

    if (typeof userId !== "string") {
      return; // TODO: throw BadRequestError
    }

    const user = await this.userService.changeStatus(asUserId(userId), {
      status,
    });

    return res.status(200).json({
      message: "User status updated successfully",
      data: {
        user,
      },
    });
  }

  async deactivateUser(req: Request, res: Response) {
    const { userId } = req.params;

    if (typeof userId !== "string") {
      return; // TODO: throw BadRequestError
    }

    const user = await this.userService.deactivateUser(asUserId(userId));

    return res.status(200).json({
      message: "User status deactivated successfully",
      data: {
        user,
      },
    });
  }
}
