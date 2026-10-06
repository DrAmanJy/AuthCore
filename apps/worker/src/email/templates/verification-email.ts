// templates/verification-email.ts

export interface VerificationEmailTemplateData {
  displayName: string;
  verificationUrl: string;
}

export function verificationEmailTemplate(data: VerificationEmailTemplateData): {
  subject: string;
  html: string;
  text: string;
} {
  return {
    subject: `Verify your email address`,

    html: `
      <!DOCTYPE html>
      <html>
        <body>
          <h1>Welcome, ${data.displayName}</h1>

          <p>
            Please verify your email address by clicking the button below.
          </p>

          <a href="${data.verificationUrl}">
            Verify Email
          </a>

          <p>
            If you didn't create this account, you can ignore this email.
          </p>
        </body>
      </html>
    `,

    text: `
      Welcome, ${data.displayName}!

      Please verify your email address:

      ${data.verificationUrl}

      If you didn't create this account, you can ignore this email.
    `,
  };
}
