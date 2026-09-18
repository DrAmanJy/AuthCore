import { createHash, randomBytes } from "node:crypto";

import { config } from "@authcore/config";
import { asVerificationTokenHash } from "@authcore/database";
import { getExpiryTime } from "@authcore/database";
import type {
  VerificationTokenId,
  UserId,
  VerificationToken,
  VerificationTokenRepository,
  VerificationTokenType,
} from "@authcore/database";
import type { CreateRecoveryTokenData, RecoveryTokenResult } from "./auth.types.js";

export class RecoveryService {
  constructor(
    private readonly verificationTokenRepository: VerificationTokenRepository,
  ) {}

  async createEmailVerificationToken(userId: UserId): Promise<RecoveryTokenResult> {
    return this.createToken({
      userId,
      type: "EMAIL_VERIFICATION",
      expiresAt: getExpiryTime(config.auth.emailVerificationTokenExpiry),
    });
  }

  async createPasswordResetToken(userId: UserId): Promise<RecoveryTokenResult> {
    return this.createToken({
      userId,
      type: "PASSWORD_RESET",
      expiresAt: getExpiryTime(config.auth.passwordResetTokenExpiry),
    });
  }

  async verifyEmail(token: string): Promise<VerificationToken> {
    return this.verifyToken(token, "EMAIL_VERIFICATION");
  }

  async verifyPasswordResetToken(token: string): Promise<VerificationToken> {
    return this.verifyToken(token, "PASSWORD_RESET");
  }

  async markTokenAsUsed(tokenId: VerificationTokenId): Promise<void> {
    const token = await this.verificationTokenRepository.markAsUsed(tokenId);

    if (!token) {
      throw new Error("Verification token not found");
    }
  }

  private async verifyToken(
    token: string,
    type: VerificationTokenType,
  ): Promise<VerificationToken> {
    const tokenHash = this.hashToken(token);

    const verificationToken = await this.verificationTokenRepository.find({
      type: "hash",
      value: tokenHash,
    });

    if (!verificationToken) {
      throw new Error("Invalid or expired token");
    }

    if (verificationToken.type !== type) {
      throw new Error("Invalid token");
    }

    if (verificationToken.usedAt) {
      throw new Error("Token has already been used");
    }

    if (verificationToken.expiresAt <= new Date()) {
      throw new Error("Token has expired");
    }

    return verificationToken;
  }

  private async createToken(data: CreateRecoveryTokenData): Promise<RecoveryTokenResult> {
    const token = this.generateToken();
    const tokenHash = this.hashToken(token);

    await this.verificationTokenRepository.create({
      userId: data.userId,
      type: data.type,
      tokenHash,
      expiresAt: data.expiresAt,
    });

    return {
      token,
      expiresAt: data.expiresAt,
    };
  }

  private generateToken(): string {
    return randomBytes(32).toString("base64url");
  }

  private hashToken(token: string) {
    return asVerificationTokenHash(createHash("sha256").update(token).digest("hex"));
  }
}
