import {internalServerError, success} from "../../http/responseTemplates.ts";
import type {CustomResponse} from "../../http/response.ts";
import type {RequestHandler} from "../../http/traits.ts";
import {handleAuth} from "../../auth/handler.ts";

export class GetItems implements RequestHandler {
    async handle(req: Request): Promise<CustomResponse> {
        return this.handleGetItems(req);
    }

    async auth(req: Request): Promise<CustomResponse> {
        return handleAuth(req);
    }

    async handleGetItems(req: Request): Promise<CustomResponse> {
        try {
            // TODO: impl
            return success("TODO");
        } catch (e) {
            return internalServerError(`An error occurred while trying to get items: ${e}`);
        }
    }
}
