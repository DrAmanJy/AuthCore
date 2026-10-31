export interface BaseEmailTemplateData {
  displayName: string;
  organizationName?: string;
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
