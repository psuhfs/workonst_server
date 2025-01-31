import type { Webhook } from "./traits.ts";
import type { CustomError } from "../errors/error.ts";

export class DiscordWebhook implements Webhook {
  private readonly webhook: string;

  constructor(webhook: string) {
    this.webhook = webhook;
  }

  async send(error: CustomError | undefined): Promise<void> {
    if (error !== undefined) {
      await this.notify(`Error: ${error.getError()}`);
    }
  }

  async notify(message: string): Promise<void> {
    try {
      const response = await fetch(this.webhook, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: message,
          username: "Bun from Stacks",
          avatar_url: "https://www.bun.co.th/uploads/logo/bun.png",
        }),
      });

      if (!response.ok) {
        console.error(
          "Failed to send message to Discord webhook:",
          response.status,
          response.statusText,
        );
      }
    } catch (error) {
      console.error("Error sending message to Discord webhook:", error);
    }
  }
}
