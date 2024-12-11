import {internalServerError, success} from "../../http/responseTemplates.ts";
import type {CustomResponse} from "../../http/response.ts";

export async function handlePopulateTable(_: Request): Promise<CustomResponse> {
    try {
        return success("Populated table"); // placeholder
    } catch (e) {
        return internalServerError(`An error occurred while trying to populate table: ${e}`);
    }
}