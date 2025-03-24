import type {Zone} from "./handler/utils.ts";
import type {CustomResponse} from "./http/response.ts";
import type {RequestHandler} from "./http/traits.ts";
import {success} from "./http/responseTemplates.ts";

export class HealthCheck implements RequestHandler {
    async handle(req: Request, params: Record<string, string>, zone: Zone): Promise<CustomResponse> {
        return success({"status": "healthy"}, req.headers.get("Origin"));
    }

    async auth(req: Request, zone: Zone): Promise<CustomResponse> {
        return success({}, req.headers.get("Origin"));
    }
}
