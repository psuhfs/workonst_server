import type { CustomError } from "../errors/error.ts";
import type { Webhook } from "./traits.ts";

export class DebugWebhook implements Webhook {
  send(error: CustomError | undefined): Promise<void> {
    if (error !== undefined) {
      console.error(`Error: ${error.getError()}`);
    }
    return Promise.resolve();
  }
}
