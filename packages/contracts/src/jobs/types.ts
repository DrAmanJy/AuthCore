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

export interface SendInvitationEmailJob {
  type: "email.send_invitation";
  version: 1;

  invitationId: string;
  email: string;
  organizationName: string;
  inviterName: string;
  roleName: string;
  invitationToken: string;
  expiresAt: string;
}
