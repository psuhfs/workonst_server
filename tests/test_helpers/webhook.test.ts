import type {Webhook} from "../../src/webhook/traits.ts";
import type {CustomError} from "../../src/errors/error.ts";
import {expect} from "bun:test";

export class TestWebhook implements Webhook {
    private readonly message: string;

    constructor(message: string) {
        this.message = message;
    }

    async send(err?: CustomError): Promise<void> {
        if (err !== undefined) {
            expect(err.getError().message).toBe(this.message);
        }

        return Promise.resolve();
    }
}