import type {
  EmailTemplate,
  PasswordResetEmailTemplateData,
} from "./email-template.types.js";
import { renderEmail, organizationSubject, emailDate } from "./email-layout.js";

/** User requests password recovery. */
export function passwordResetEmailTemplate(
  data: PasswordResetEmailTemplateData,
): EmailTemplate {
  return renderEmail({
    subject: organizationSubject("Reset your password", data.organizationName),
    preheader: "Reset your password.",
    heading: "Reset your password",
    displayName: data.displayName,
    supportUrl: data.supportUrl,
    paragraphs: [
      "We received a request to reset your AuthCore password. Use the button below to choose a new password.",
      "Your password will not change until you complete the reset.",
    ],
    details: [{ label: "Link expires", value: emailDate(data.expiresAt) }],
    action: { label: "Reset password", url: data.resetUrl },
    notice:
      "If you did not request a password reset, you can ignore this email. Do not share this reset link.",
  });
}
