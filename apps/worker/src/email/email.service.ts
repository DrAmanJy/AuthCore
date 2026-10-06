import { config } from "@authcore/config";
import type {
  SendPasswordResetEmailJob,
  SendVerificationEmailJob,
} from "@authcore/contracts";
import { sendEmail } from "./providers/resend.provider.js";
import { verificationEmailTemplate } from "./templates/verification-email.js";
import { passwordResetEmailTemplate } from "./templates/password-reset-email.js";

export class EmailService {
  async sendVerificationEmail(job: SendVerificationEmailJob): Promise<void> {
    const verificationUrl = `${config.app.frontendUrl}/verify-email?token=${encodeURIComponent(
      job.verificationToken,
    )}`;

    const template = verificationEmailTemplate({
      displayName: job.displayName,
      verificationUrl: verificationUrl,
    });

    await sendEmail({
      to: job.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    void verificationUrl;
  }

  async sendPasswordRestEmail(job: SendPasswordResetEmailJob): Promise<void> {
    const resetUrl = `${config.app.frontendUrl}/reset-password?=${encodeURIComponent(job.resetToken)}`;

    const template = passwordResetEmailTemplate({
      displayName: job.displayName,
      resetUrl,
    });

    await sendEmail({
      to: job.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
    void resetUrl;
  }
}
