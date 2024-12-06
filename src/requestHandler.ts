import {generateEmailBody, type PointsDetails} from "./utils.ts";
import {sendEmail} from "./email.ts";
import {insertToDatabase} from "./mysql.ts";
import {getEmployee, getEmployees as getEmployees, getShift} from "./employeeRecords.ts";
import {CustomResponse} from "./http/response.ts";
import {internalServerError, notFound, success} from "./http/responseTemplates.ts";

export async function handleRequest(req: Request): Promise<CustomResponse> {
    if (req.method === 'POST') return await handlePost(req);
    else if (req.method === 'GET') return handleGet(req);
    else return new CustomResponse(new Response(`${req.method} requests are not supported`)); // we don't need to log this error
}

async function handleGet(req: Request): Promise<CustomResponse> {
    const url = new URL(req.url);

    if (url.pathname.toLowerCase() == "/employees") {
        let url = process.env.GETALL_URL;
        try {
            let value = await getEmployees(url);
            return success(JSON.stringify(value));
        } catch (e) {
            return internalServerError(`An error occurred while trying to fetch employees: ${e}`);
        }
    }

    if (url.pathname.toLowerCase().startsWith("/employee")) {
        let empNumber = url.pathname.toLowerCase().replace("/employee/", "");
        try {
            // check if it's number
            let num = Number.isNaN(parseInt(empNumber, 10));
            if (num) {
                return internalServerError("Error parsing Employee Number. The url should be in the form /employee/<number>");
            }

            let url = process.env.GETALL_URL;
            let value = await getEmployee(url, empNumber);

            return success(JSON.stringify(value));
        } catch (e) {
            return internalServerError(`An error occurred while trying to fetch employee: ${e}`);
        }
    }

    return notFound(`Invalid route ${url.pathname}`);
}

async function handlePost(req: Request): Promise<CustomResponse> {
    const url = new URL(req.url);
    if (url.pathname.toLowerCase() == "/incr") {

        /// Body should be deserializable to PointsDetails.

        let body: PointsDetails = await req.json();
        await insertToDatabase(body);

        console.debug(`sending email to ${body.email}`)

        await insertToDatabase(body);

        await sendEmail({
            subject: "Shift Update Notification",
            to: body.email,
            text: generateEmailBody(body),
        });

        return success("Email sent");
    }

    if (url.pathname.toLowerCase() == "/shift") {
        let url = process.env.GETALL_URL;
        try {

            // Body should look like:
            // {
            //   "date": "yyyy/month/day"
            // }

            let body = await req.json();
            let value = await getShift(url, body["date"]);
            return success(JSON.stringify(value));
        } catch (e) {
            return internalServerError(`An error occurred while trying to fetch shift(s): ${e}`);
        }
    }

    return notFound(`Invalid route ${url.pathname}`);
}
