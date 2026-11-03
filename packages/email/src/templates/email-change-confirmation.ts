import type { EmailPresentationData, EmailTemplate } from "./email-template.types.js";
import { renderEmail, emailDate } from "./email-layout.js";

export interface EmailChangeConfirmationProps extends EmailPresentationData {
  displayName: string;
  newEmail: string;
  confirmUrl: string;
  expiresAt?: string;
}

/** Future verified email-change request; send only after that flow is implemented. */
export function emailChangeConfirmationTemplate(
  data: EmailChangeConfirmationProps,
): EmailTemplate {
  return renderEmail({
    subject: "Confirm your new email address | AuthCore",
    preheader: "Confirm your new email address.",
    heading: "Confirm your new email address",
    displayName: data.displayName,
    supportUrl: data.supportUrl,
    paragraphs: [
      "We received a request to use this email address for your AuthCore account. Confirm that you can receive email here to continue.",
    ],
    details: [
      { label: "Requested email address", value: data.newEmail },
      ...(data.expiresAt
        ? [{ label: "Link expires", value: emailDate(data.expiresAt) }]
        : []),
    ],
    action: { label: "Confirm email address", url: data.confirmUrl },
    notice:
      "If you did not request this change, do not confirm it. Open AuthCore from your usual app or saved address and contact your administrator.",
  });
}
