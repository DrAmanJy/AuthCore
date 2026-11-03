export interface EmailPresentationData {
  /** Optional trusted HTTPS help page. */
  supportUrl?: string;
}

export interface BaseEmailTemplateData extends EmailPresentationData {
  displayName: string;
  organizationName?: string;
  /** Absolute ISO 8601 timestamp, including Z or a numeric timezone offset. */
  expiresAt: string;
}

export interface PasswordResetEmailTemplateData extends BaseEmailTemplateData {
  resetUrl: string;
}

export interface VerificationEmailTemplateData extends BaseEmailTemplateData {
  verificationUrl: string;
}

export interface ResendVerificationEmailTemplateData extends BaseEmailTemplateData {
  verificationUrl: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface NotificationEmailData extends EmailPresentationData {
  displayName: string;
  /** Time the event happened, not the time this template is rendered. */
  occurredAt: string;
}

export interface OrganizationNotificationEmailData extends NotificationEmailData {
  organizationName: string;
}

export interface EmailDetail {
  label: string;
  value: string;
}

/** Plain copy only. The layout escapes content and validates every URL. */
export interface EmailContent extends EmailPresentationData {
  subject: string;
  preheader: string;
  heading: string;
  displayName?: string;
  paragraphs: readonly string[];
  details?: readonly EmailDetail[];
  action?: { label: string; url: string };
  notice: string;
}
