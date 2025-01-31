import type { CustomError } from "../errors/error.ts";
import type { Webhook } from "../webhook/traits.ts";

export class CustomResponse {
  private readonly response: Response;
  private readonly err?: CustomError;

  constructor(data: Response, error?: CustomError) {
    this.response = data;
    this.err = error;
  }

  public getResponse(): Response {
    return this.response;
  }

  public async intoResponse(webhook: Webhook) {
    await webhook.send(this.err);
    return this.response;
  }

  public error(): CustomError | undefined {
    return this.err;
  }

  public isErr(): boolean {
    return !!this.err;
  }
}
