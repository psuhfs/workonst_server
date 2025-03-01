import {getEmployee, getEmployees} from "./employeeRecords.ts";
import {
    internalServerError,
    success,
    unauthorized,
} from "../../http/responseTemplates.ts";
import type {CustomResponse} from "../../http/response.ts";
import type {RequestHandler} from "../../http/traits.ts";
import {handleAuth} from "../../auth/handler.ts";
import {Zone} from "../../handler/utils.ts";

export class GetEmployees implements RequestHandler {
    async handle(
        req: Request,
        _params: Record<string, string>,
    ): Promise<CustomResponse> {
        return this.handleGetEmployees(req);
    }

    async auth(req: Request, zone: Zone): Promise<CustomResponse> {
        return handleAuth(req, zone);
    }

    async handleGetEmployees(req: Request): Promise<CustomResponse> {
        try {
            let url = process.env.GETALL_URL;
            let value = await getEmployees(url);
            return success(value, req.headers.get("Origin"));
        } catch (e) {
            return internalServerError(
                `An error occurred while trying to fetch employees: ${e}`,
            );
        }
    }
}

export class GetEmployee implements RequestHandler {
    async handle(
        req: Request,
        params: Record<string, string>,
    ): Promise<CustomResponse> {
        return this.handleGetEmployee(req, params);
    }

    async auth(req: Request, zone: Zone): Promise<CustomResponse> {
        return handleAuth(req, zone);
    }

    async handleGetEmployee(
        req: Request,
        params: Record<string, string>,
    ): Promise<CustomResponse> {
        try {
            let empNumber = params["id"];
            let url = process.env.GETALL_URL;
            let value = await getEmployee(url, empNumber);

            return success(value, req.headers.get("Origin"));
        } catch (e) {
            return internalServerError(
                `An error occurred while trying to fetch employee: ${e}`,
            );
        }
    }
}
