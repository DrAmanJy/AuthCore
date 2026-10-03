// email/email.consumer.ts

import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  type Message,
} from "@aws-sdk/client-sqs";

import { emailJobSchema } from "@authcore/contracts";
import { logger } from "@authcore/logger";

import { sqsClient } from "@authcore/queue";

import type { EmailService } from "./email.service.js";

export class EmailConsumer {
  private running = true;
  constructor(
    private readonly queueUrl: string,
    private readonly emailService: EmailService,
  ) {}

  async start(): Promise<void> {
    logger.info(
      {
        event: "worker.started",
        worker: "email",
      },
      "Email worker started",
    );

    while (this.running) {
      const messages = await this.receiveMessages();

      for (const message of messages) {
        await this.processMessage(message);
      }
    }
  }

  stop(): void {
    this.running = false;
  }

  private async receiveMessages(): Promise<Message[]> {
    const result = await sqsClient.send(
      new ReceiveMessageCommand({
        QueueUrl: this.queueUrl,

        MaxNumberOfMessages: 10,

        WaitTimeSeconds: 20,

        VisibilityTimeout: 60,

        MessageAttributeNames: ["All"],
      }),
    );

    return result.Messages ?? [];
  }

  private async processMessage(message: Message): Promise<void> {
    if (message.Body === undefined || message.ReceiptHandle === undefined) {
      logger.warn(
        {
          event: "queue.job.invalid",
          worker: "email",
          messageId: message.MessageId,
          reason: "missing_body_or_receipt_handle",
        },
        "Invalid SQS message",
      );

      return;
    }

    const parsed = emailJobSchema.safeParse(JSON.parse(message.Body));

    if (!parsed.success) {
      logger.error(
        {
          event: "queue.job.invalid",
          worker: "email",
          messageId: message.MessageId,
          reason: "schema_validation_failed",
        },
        "Email job failed schema validation",
      );

      return;
    }

    const job = parsed.data;

    logger.info(
      {
        event: "queue.job.received",
        worker: "email",
        messageId: message.MessageId,
        jobType: job.type,
        userId: job.userId,
      },
      "Email job received",
    );

    try {
      switch (job.type) {
        case "email.send_verification":
          await this.emailService.sendVerificationEmail(job);
          break;

        case "email.send_password_reset":
          await this.emailService.sendPasswordRestEmail(job);
      }

      await this.deleteMessage(message.ReceiptHandle);

      logger.info(
        {
          event: "queue.job.completed",
          worker: "email",
          messageId: message.MessageId,
          jobType: job.type,
          userId: job.userId,
        },
        "Email job completed",
      );
    } catch (error) {
      logger.error(
        {
          event: "queue.job.failed",
          worker: "email",
          messageId: message.MessageId,
          jobType: job.type,
          userId: job.userId,
          err: error,
        },
        "Email job failed",
      );

      // IMPORTANT:
      // Do NOT delete the message.
      //
      // SQS will make it visible again after the
      // visibility timeout and retry it.
    }
  }

  private async deleteMessage(receiptHandle: string): Promise<void> {
    await sqsClient.send(
      new DeleteMessageCommand({
        QueueUrl: this.queueUrl,
        ReceiptHandle: receiptHandle,
      }),
    );
  }
}
