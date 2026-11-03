import type { EmailTemplate, NotificationEmailData } from "./email-template.types.js";
import { renderEmail, emailDate } from "./email-layout.js";

export interface PasswordChangedEmailData extends NotificationEmailData {
  securityUrl: string;
}

/** An authenticated password change succeeds. */
export function passwordChangedEmailTemplate(
  data: PasswordChangedEmailData,
): EmailTemplate {
  return renderEmail({
    subject: "Your password was changed | AuthCore",
    preheader: "Your password was changed.",
    heading: "Your password was changed",
    displayName: data.displayName,
    supportUrl: data.supportUrl,
    paragraphs: [
      "The password for your AuthCore account was changed. This email is a confirmation; you do not need to reply.",
    ],
    details: [{ label: "When", value: emailDate(data.occurredAt) }],
    action: { label: "Review account security", url: data.securityUrl },
    notice:
      "If you did not make this change, open AuthCore from your usual app or saved address and review your account security. Contact your administrator if you need help.",
  });
}
