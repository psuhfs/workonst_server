import {internalServerError, success, unauthorized} from "../../http/responseTemplates.ts";
import type {CustomResponse} from "../../http/response.ts";
import type {RequestHandler} from "../../http/traits.ts";
import {extractTokenDetails, extractTokenFromHeaders} from "../../auth/token_extractor.ts";
import {getUserByUsername} from "../../dbUtils/user_schema.ts";
import {getCategories} from "../../dbUtils/categories_schema.ts";

export class GetItems implements RequestHandler {
    async handle(req: Request): Promise<CustomResponse> {
        return this.handleGetItems(req);
    }

    async auth(req: Request): Promise<CustomResponse> {
        return success("Blah", req.headers.get("Origin"));
    }

    async handleGetItems(req: Request): Promise<CustomResponse> {
        try {
            let token = extractTokenFromHeaders(req.headers);
            if (!token) {
                return unauthorized("No token provided.");
            }
            let details = extractTokenDetails({token});
            if (!details) {
                return unauthorized();
            }

            let user = await getUserByUsername(details["username"], details["pw"]);
            if (!user) {
                return unauthorized();
            }

            let json = await getCategories();
            let filtered = this.filterObjectKeys(json, user.stockOnAccess);

            return success(filtered, req.headers.get("Origin"));
        } catch (e) {
            return internalServerError(
                `An error occurred while trying to get items: ${e}`,
            );
        }
    }

    filterObjectKeys(obj: any, keysToRemove: string[]): any {
        const result: any = {};

        for (const key in obj) {
            if (!obj.hasOwnProperty(key) || keysToRemove.includes(key)) {
                result[key] = obj[key];
            }
        }

        return result;
    }
}
