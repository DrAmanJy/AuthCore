import type { QueueService } from "./queue.service.js";
import type {
  SendVerificationEmailJob,
  SendPasswordResetEmailJob,
} from "@authcore/contracts";

export class EmailQueue {
  constructor(
    private readonly queueService: QueueService,
    private readonly queueUrl: string,
  ) {}

  async publishVerificationEmail(
    data: Omit<SendVerificationEmailJob, "type" | "version">,
  ): Promise<void> {
    await this.queueService.send(this.queueUrl, {
      type: "email.send_verification",
      version: 1,
      ...data,
    });
  }

  async publishPasswordResetEmail(
    data: Omit<SendPasswordResetEmailJob, "type" | "version">,
  ): Promise<void> {
    await this.queueService.send(this.queueUrl, {
      type: "email.send_password_reset",
      version: 1,
      ...data,
    });
  }
}
