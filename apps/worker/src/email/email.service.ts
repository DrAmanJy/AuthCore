import { config } from "@authcore/config";
import type {
  SendPasswordResetEmailJob,
  SendVerificationEmailJob,
} from "@authcore/contracts";
import { sendEmail } from "./providers/resend.provider.js";

export class EmailService {
  async sendVerificationEmail(job: SendVerificationEmailJob): Promise<void> {
    const verificationUrl = `${config.app.frontendUrl}/verify-email?token=${encodeURIComponent(
      job.verificationToken,
    )}`;

    await sendEmail({
      to: job.email,
      subject: `Verify your email - ${job.displayName}`,
      html: "<html>",
    });

    void verificationUrl;
  }

  async sendPasswordRestEmail(job: SendPasswordResetEmailJob): Promise<void> {
    const resetUrl = `${config.app.frontendUrl}/reset-password?=${encodeURIComponent(job.resetToken)}`;

    await sendEmail({
      to: job.email,
      subject: `Verify your email - ${job.displayName}`,
      html: "<html>",
    });
    void resetUrl;
  }
}
