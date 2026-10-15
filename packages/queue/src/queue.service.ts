import { SendMessageCommand } from "@aws-sdk/client-sqs";
import { sqsClient } from "./sqs.client.js";

export class QueueService {
  async send<T>(queueUrl: string, message: T): Promise<void> {
    await sqsClient.send(
      new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(message),
      }),
    );
  }
}
