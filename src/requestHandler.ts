import {generateEmailBody, type PointsDetails} from "./utils.ts";
import {sendEmail} from "./email.ts";
import {insertToDatabase} from "./mysql.ts";
import {getEmployee, getEmployees as getEmployees, getShift} from "./employeeRecords.ts";

import {Router} from "./http/router.ts";
import {RequestType} from "./http/requestType.ts";

export class RequestHandler {
    constructor(private request: Request) {
        this.request = request;
    }

    public async handleRequest(req: Request): Promise<Response | Error> {
        let router = new Router();
        if (req.method === 'POST') return await handlePost(req, router);
        else if (req.method === 'GET') return this.handleGet(req, router);
        else return new Response(`${req.method} requests are not supported`);
    }

    // TODO: refactor these functions to dedicated files.
    async handleGet(req: Request, router: Router): Promise<Response | Error> {
        const url = new URL(req.url);

        async function handleGetEmployees(_: Request): Promise<Response | Error> {
            let url = process.env.GETALL_URL;
            try {
                let value = await getEmployees(url);
                let resp = new Response(JSON.stringify(value));
                resp.headers.set("Content-Type", "application/json");

                return resp;
            } catch (e) {
                return new Error(`An error occurred while trying to fetch employees: ${e}`);
            }
        }

        router.add(RequestType.GET, "/employees", handleGetEmployees);
        router.add(RequestType.GET, "/employee/:empNumber", handleGetEmployees);

        if (url.pathname.toLowerCase().startsWith("/employee")) {
            let empNumber = url.pathname.toLowerCase().replace("/employee/", "");
            try {
                // check if it's number
                let num = Number.isNaN(parseInt(empNumber, 10));
                if (num) {
                    return new Error("Error parsing Employee Number. The url should be in the form /employee/<number>");
                }

                let url = process.env.GETALL_URL;
                let value = await getEmployee(url, empNumber);
                let resp = new Response(JSON.stringify(value));
                resp.headers.set("Content-Type", "application/json");

                return resp;
            } catch (e) {
                return new Error(`An error occurred while trying to fetch employee: ${e}`);
            }
        }

        return new Response(`Invalid route ${url.pathname}`);
    }

}

async function handlePost(req: Request): Promise<Response | Error> {
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

        return new Response("Email sent");
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
            let resp = new Response(JSON.stringify(value));
            resp.headers.set("Content-Type", "application/json");
            return resp;
        } catch (e) {
            return new Error(`An error occurred while trying to fetch shift(s): ${e}`);
        }
    }

    return new Response(`Invalid route ${url.pathname}`);
}
