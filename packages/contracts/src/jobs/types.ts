export interface SendVerificationEmailJob {
  type: "email.send_verification";
  version: 1;

  userId: string;
  email: string;
  displayName: string;
  organizationName?: string;
  verificationToken: string;
  expiresAt: string;
}
export interface SendPasswordResetEmailJob {
  type: "email.send_password_reset";
  version: 1;

  userId: string;
  email: string;
  displayName: string;
  organizationName?: string;
  resetToken: string;
  expiresAt: string;
}
