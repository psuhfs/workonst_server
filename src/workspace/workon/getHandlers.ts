import {getEmployee, getEmployees} from "./employeeRecords.ts";
import {internalServerError, success} from "../../http/responseTemplates.ts";
import type {CustomResponse} from "../../http/response.ts";

export async function handleGetEmployees(_: Request): Promise<CustomResponse> {
    try {
        let url = process.env.GETALL_URL;
        let value = await getEmployees(url);
        return success(value);
    } catch (e) {
        return internalServerError(`An error occurred while trying to fetch employees: ${e}`);
    }
}

export async function handleGetEmployee(_: Request, params: Record<string, string>): Promise<CustomResponse> {
    try {
        let empNumber = params["id"];
        let url = process.env.GETALL_URL;
        let value = await getEmployee(url, empNumber);

        return success(value);
    }catch (e) {
        return internalServerError(`An error occurred while trying to fetch employee: ${e}`);
    }
}