import type {CustomError} from "../errors/error.ts";

export interface Webhook {
    send: (error: CustomError | undefined) => Promise<void>;
}
