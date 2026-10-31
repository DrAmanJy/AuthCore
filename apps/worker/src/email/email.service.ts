import { config } from "@authcore/config";
import type {
  SendInvitationEmailJob,
  SendPasswordResetEmailJob,
  SendVerificationEmailJob,
} from "@authcore/contracts";
import { sendEmail } from "./providers/resend.provider.js";
import { verificationEmailTemplate } from "./templates/verification-email.js";
import { passwordResetEmailTemplate } from "./templates/password-reset-email.js";
import { invitationEmailTemplate } from "./templates/invitation-email.js";

export class EmailService {
  async sendVerificationEmail(job: SendVerificationEmailJob): Promise<void> {
    const verificationUrl = `${config.app.frontendUrl}/verify-email?token=${encodeURIComponent(
      job.verificationToken,
    )}`;

    const template = verificationEmailTemplate({
      displayName: job.displayName,
      organizationName: job.organizationName,
      verificationUrl: verificationUrl,
      expiresAt: job.expiresAt,
    });

    await sendEmail({
      to: job.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendPasswordRestEmail(job: SendPasswordResetEmailJob): Promise<void> {
    const resetUrl = `${config.app.frontendUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(job.resetToken.trim())}`;

    const template = passwordResetEmailTemplate({
      displayName: job.displayName,
      resetUrl,
      organizationName: job.organizationName,
      expiresAt: job.expiresAt,
    });

    await sendEmail({
      to: job.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendInvitationEmail(job: SendInvitationEmailJob): Promise<void> {
    const inviteUrl = `${config.app.frontendUrl}/invitations/accept?token=${encodeURIComponent(job.invitationToken)}`;

    const template = invitationEmailTemplate({
      organizationName: job.organizationName,
      inviterName: job.inviterName,
      roleName: job.roleName,
      inviteUrl,
      expiresAt: job.expiresAt,
    });

    await sendEmail({
      to: job.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }
}
