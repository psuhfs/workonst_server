import {internalServerError, success} from "../../http/responseTemplates.ts";
import type {CustomResponse} from "../../http/response.ts";

export async function handleSendEmail(_: Request): Promise<CustomResponse> {
    try {
        return success("Email sent"); // placeholder
    } catch (e) {
        return internalServerError(`An error occurred while trying to send email: ${e}`);
    }
}