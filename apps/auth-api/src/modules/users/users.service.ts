import type { UserId } from "./users.types.js";
import { UserDocument, UserRepository, UserStatus } from "@authcore/database";
import { UpdateProfile, UserProfile } from "@authcore/contracts";

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getUserById(userId: UserId) {
    return this.userRepository.findById(userId);
  }
  async getUserByEmail(email: string) {
    return this.userRepository.findByEmail(email);
  }

  async getPublicUserProfile(userId: UserId): Promise<UserProfile | null> {
    const user = await this.userRepository.findById(userId);
    if (user?.status !== "active") {
      return null;
    }
    return {
      id: user._id.toString() || user.id.toString(),
      displayName: user.displayName,
      createdAt: user.createdAt,
    };
  }

  async updateUserProfile(
    userId: UserId,
    { displayName }: UpdateProfile,
  ): Promise<UserDocument | null> {
    const user = await this.userRepository.findById(userId);
    if (user?.status !== "active") {
      return null; //todo throw api error
    }
    if (displayName === user.displayName) {
      return user;
    }
    return this.userRepository.update(userId, { displayName });
  }

  async changeEmail(userId: UserId, email: string) {
    return this.userRepository.update(userId, { email });
  }

  async changeDisplayName(userId: UserId, { displayName }: { displayName: string }) {
    return this.userRepository.update(userId, { displayName });
  }

  async changeAccountStatus(userId: UserId, { status }: { status: UserStatus }) {
    return this.userRepository.update(userId, { status });
  }

  async deleteAccount(userId: UserId) {
    return this.userRepository.delete(userId);
  }

  async deactivateAccount(userId: UserId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return null; //todo throw user not fund error
    }
    switch (user?.status) {
      case "pending":
        return null; // todo throw user setup is pending

      case "suspended":
        return null; // todo throw user account is suspended

      case "deactivated":
        return null; // todo throw user account already deactivated
      default:
        break;
    }
    return this.userRepository.update(userId, { status: "deactivated" });
  }
}
