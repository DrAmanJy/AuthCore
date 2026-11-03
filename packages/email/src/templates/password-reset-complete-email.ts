import type { EmailTemplate, NotificationEmailData } from "./email-template.types.js";
import { renderEmail, emailDate } from "./email-layout.js";

export interface PasswordResetCompleteEmailData extends NotificationEmailData {
  securityUrl: string;
}

/** Password recovery completes successfully. */
export function passwordResetCompleteEmailTemplate(
  data: PasswordResetCompleteEmailData,
): EmailTemplate {
  return renderEmail({
    subject: "Your password reset is complete | AuthCore",
    preheader: "Your password has been reset.",
    heading: "Your password has been reset",
    displayName: data.displayName,
    supportUrl: data.supportUrl,
    paragraphs: [
      "A new password was saved for your AuthCore account using the password reset process.",
      "Use your new password the next time you sign in.",
    ],
    details: [{ label: "When", value: emailDate(data.occurredAt) }],
    action: { label: "Review account security", url: data.securityUrl },
    notice:
      "If you did not make this change, open AuthCore from your usual app or saved address and review your account security. Contact your administrator if you need help.",
  });
}
