import {internalServerError, success} from "../../http/responseTemplates.ts";
import type {CustomResponse} from "../../http/response.ts";

export async function handleGetItems(_: Request): Promise<CustomResponse> {
    try {
        return success("getting items..."); // placeholder
    } catch (e) {
        return internalServerError(`An error occurred while trying to get items: ${e}`);
    }
}