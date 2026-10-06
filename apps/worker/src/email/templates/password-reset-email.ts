// templates/password-reset-email.ts

export interface PasswordResetEmailTemplateData {
  displayName: string;
  resetUrl: string;
}

export function passwordResetEmailTemplate(data: PasswordResetEmailTemplateData): {
  subject: string;
  html: string;
  text: string;
} {
  return {
    subject: `Reset your password`,

    html: `
      <!DOCTYPE html>
      <html>
        <body>
          <h1>Password Reset</h1>

          <p>
            Hi ${data.displayName},
          </p>

          <p>
            Click the button below to reset your password.
          </p>

          <a href="${data.resetUrl}">
            Reset Password
          </a>
        </body>
      </html>
    `,

    text: `
      Hi ${data.displayName},

      Reset your password here:

      ${data.resetUrl}
    `,
  };
}
