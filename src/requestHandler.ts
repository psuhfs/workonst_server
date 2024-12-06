import {generateEmailBody, type PointsDetails} from "./utils.ts";
import {sendEmail} from "./email.ts";
import {insertToDatabase} from "./mysql.ts";
import {getEmployee, getEmployees as getEmployees, getShift} from "./employeeRecords.ts";

import { generateAndSendExcel } from "./stockon/requestHandlerFunctions.ts";

export async function handleRequest(req: Request): Promise<Response | Error> {
    if (req.method === 'POST') return await handlePost(req);
    else if (req.method === 'GET') return handleGet(req);
    else return new Response(`${req.method} requests are not supported`);
}

async function handleGet(req: Request): Promise<Response | Error> {
    const url = new URL(req.url);

    if (url.pathname.toLowerCase() == "/employees") {
        // return await getAllEmployees();
        return getAllEmployees();
    }

    if (url.pathname.toLowerCase().startsWith("/employee")) {
        let empNumber = url.pathname.toLowerCase().replace("/employee/", "");
        return getEmployeeByID(empNumber);
    }

    return new Response(`Invalid route ${url.pathname}`);
}

async function handlePost(req: Request): Promise<Response | Error> {
    const url = new URL(req.url);
    if (url.pathname.toLowerCase() == "/incr") {
        /// Body should be deserializable to PointsDetails.

        const body: PointsDetails = await req.json();
        return incrRequest(body);
    }

    if (url.pathname.toLowerCase() == "/shift") {
        return getShiftData(await req.json());
    }

    if (url.pathname.toLowerCase() == "/sendorder") {
        let body = await req.json();
        await sendEmail(body);
        return new Response("Email sent");
    }

    if (url.pathname.toLowerCase() == "/sendexcel") {
        let body = await req.json();
        
    }

    return new Response(`Invalid route ${url.pathname}`);
}


// for handleGet, gets all employees
async function getAllEmployees(): Promise<Response | Error> {
    try {
        let url = process.env.GETALL_URL;
        let value = await getEmployees(url);
        let resp = new Response(JSON.stringify(value));
        resp.headers.set("Content-Type", "application/json");

        return resp;
    } catch (e) {
        return new Error(`An error occurred while trying to fetch employees: ${e}`);
    }
}

// for handleGet, gets employee by ID
async function getEmployeeByID(empNumber: string): Promise<Response | Error> {
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


// for handlePost, inserts data to database
async function incrRequest(body: PointsDetails): Promise<Response | Error> {
    try {
        await insertToDatabase(body);

        console.debug(`sending email to ${body.email}`)

        await insertToDatabase(body);

        await sendEmail({
            subject: "Shift Update Notification",
            to: body.email,
            text: generateEmailBody(body),
        });

        return new Response("Email sent");
    } catch (e) {
        return new Error(`An error occurred while processing the request: ${e}`);
    }
}

// for handlePost, gets shift data
async function getShiftData(body: { date: string }): Promise<Response | Error> {
    try {
        let url = process.env.GETALL_URL;

        // Body should look like:
        // {
        //   "date": "yyyy/month/day"
        // }
        
        let value = await getShift(url, body["date"]);
        let resp = new Response(JSON.stringify(value));
        resp.headers.set("Content-Type", "application/json");
        return resp;
    } catch (e) {
        return new Error(`An error occurred while trying to fetch shift(s): ${e}`);
    }
}
