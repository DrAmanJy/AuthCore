import type {
  EmailTemplate,
  OrganizationNotificationEmailData,
} from "./email-template.types.js";
import { renderEmail, emailDate } from "./email-layout.js";

export interface SessionsRevokedEmailData extends OrganizationNotificationEmailData {
  scope: "single" | "all" | "other";
  securityUrl: string;
}

/** Explicit session revocation completes; consolidate an all-session operation into one message. */
export function sessionsRevokedEmailTemplate(
  data: SessionsRevokedEmailData,
): EmailTemplate {
  const descriptions = {
    single: "A sign-in session for this organization was ended.",
    all: "All your sign-in sessions for this organization were ended.",
    other:
      "Your other sign-in sessions for this organization were ended. The current session was kept.",
  } as const;
  return renderEmail({
    subject: "Your sign-in sessions were updated | AuthCore",
    preheader: "Your sign-in sessions were updated.",
    heading: "Your sign-in sessions were updated",
    displayName: data.displayName,
    supportUrl: data.supportUrl,
    paragraphs: [descriptions[data.scope]],
    details: [
      { label: "Organization", value: data.organizationName },
      { label: "When", value: emailDate(data.occurredAt) },
    ],
    action: { label: "Review account security", url: data.securityUrl },
    notice:
      "If you did not make this change, open AuthCore from your usual app or saved address and review your account security. Contact your administrator if you need help.",
  });
}
