import type { EmailTemplate, NotificationEmailData } from "./email-template.types.js";
import { renderEmail, emailDate } from "./email-layout.js";

export type AccountDeletedEmailData = NotificationEmailData;

/** Account deletion succeeds; capture recipient details before deleting. */
export function accountDeletedEmailTemplate(
  data: AccountDeletedEmailData,
): EmailTemplate {
  return renderEmail({
    subject: "Your account was deleted | AuthCore",
    preheader: "Your account was deleted.",
    heading: "Your account was deleted",
    displayName: data.displayName,
    supportUrl: data.supportUrl,
    paragraphs: [
      "Your AuthCore account was deleted. You can no longer use that account to sign in.",
    ],
    details: [{ label: "When", value: emailDate(data.occurredAt) }],
    notice:
      "If you did not request this deletion, contact your administrator. This email does not confirm deletion of records held by other services.",
  });
}
