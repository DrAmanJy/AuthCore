import type { EmailTemplate, NotificationEmailData } from "./email-template.types.js";
import { renderEmail, organizationSubject, emailDate } from "./email-layout.js";

export interface NewSignInEmailData extends NotificationEmailData {
  organizationName?: string;
  deviceName: string;
  ipAddress?: string;
  securityUrl: string;
}

/** Successful login from a newly recognized device or security-relevant context; not every refresh. */
export function newSignInEmailTemplate(data: NewSignInEmailData): EmailTemplate {
  return renderEmail({
    subject: organizationSubject("New sign-in to your account", data.organizationName),
    preheader: "A new sign-in to your account.",
    heading: "A new sign-in to your account",
    displayName: data.displayName,
    supportUrl: data.supportUrl,
    paragraphs: [
      "Your AuthCore account was used to sign in. Review the details below.",
      "If this was you, no action is needed. Device names and IP addresses may vary when you use a VPN or a different network.",
    ],
    details: [
      { label: "Device", value: data.deviceName },
      ...(data.ipAddress ? [{ label: "IP address", value: data.ipAddress }] : []),
      ...(data.organizationName
        ? [{ label: "Organization", value: data.organizationName }]
        : []),
      { label: "When", value: emailDate(data.occurredAt) },
    ],
    action: { label: "Review account security", url: data.securityUrl },
    notice:
      "If you do not recognize this sign-in, open AuthCore from your usual app or saved address, change your password, and revoke sessions you do not recognize.",
  });
}
