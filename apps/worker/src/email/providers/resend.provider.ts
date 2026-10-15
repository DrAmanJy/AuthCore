import { config } from "@authcore/config";
import { logger } from "@authcore/logger";
import { Resend } from "resend";

const resend = new Resend(config.email.resendApiKey);

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const { error } = await resend.emails.send({
    from: config.email.from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    ...(options.text !== undefined && {
      text: options.text,
    }),
  });

  if (error) {
    const providerError = new Error(`Resend failed to send email: ${error.message}`, {
      cause: error,
    });

    logger.error(
      {
        event: "email.send.failed",
        provider: "resend",
        err: error,
      },
      "Failed to send email",
    );

    throw providerError;
  }

  logger.info(
    { event: "email.send.success", provider: "resend" },
    "Resend successfully send the email",
  );
}
