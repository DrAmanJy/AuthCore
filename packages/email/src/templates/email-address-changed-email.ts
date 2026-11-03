import type { EmailTemplate, NotificationEmailData } from "./email-template.types.js";
import { renderEmail, emailDate } from "./email-layout.js";

export interface EmailAddressChangedEmailData extends NotificationEmailData {
  newEmail: string;
}

/** Future verified email change commits; notify old and new mailboxes. */
export function emailAddressChangedEmailTemplate(
  data: EmailAddressChangedEmailData,
): EmailTemplate {
  return renderEmail({
    subject: "Your account email address changed | AuthCore",
    preheader: "Your account email address changed.",
    heading: "Your account email address changed",
    displayName: data.displayName,
    supportUrl: data.supportUrl,
    paragraphs: [
      "The email address used for your AuthCore account was changed after confirmation.",
    ],
    details: [
      { label: "New email address", value: data.newEmail },
      { label: "When", value: emailDate(data.occurredAt) },
    ],
    notice:
      "If you did not make this change, open AuthCore from your usual app or saved address and review your account security. Contact your administrator if you need help.",
  });
}
