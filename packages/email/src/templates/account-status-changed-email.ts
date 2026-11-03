import type { EmailTemplate, NotificationEmailData } from "./email-template.types.js";
import { renderEmail, emailDate } from "./email-layout.js";

export interface AccountStatusChangedEmailData extends NotificationEmailData {
  status: "active" | "suspended" | "inactive" | "deactivated";
}

/** A meaningful account status change succeeds; avoid duplicating welcome on initial verification. */
export function accountStatusChangedEmailTemplate(
  data: AccountStatusChangedEmailData,
): EmailTemplate {
  const descriptions = {
    active:
      "Your AuthCore account is active. Organization access still depends on your membership.",
    suspended:
      "Your AuthCore account has been suspended. Contact your administrator to discuss access.",
    inactive:
      "Your AuthCore account is now inactive. Contact your administrator if you need access.",
    deactivated:
      "Your AuthCore account has been deactivated. Contact your administrator if this was unexpected.",
  } as const;
  return renderEmail({
    subject: "Your account status changed | AuthCore",
    preheader: "Your account status changed.",
    heading: "Your account status changed",
    displayName: data.displayName,
    supportUrl: data.supportUrl,
    paragraphs: [descriptions[data.status]],
    details: [
      { label: "Account status", value: data.status },
      { label: "When", value: emailDate(data.occurredAt) },
    ],
    notice:
      "For questions about this change, contact your administrator. Do not send your password or security links by email.",
  });
}
