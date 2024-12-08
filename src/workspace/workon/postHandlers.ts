import type {CustomResponse} from "../../http/response.ts";
import {Db, prisma} from "../../handler/db.ts";
import {type PointsDetails} from "../../handler/utils.ts";
import {Email} from "../../handler/email.ts";
import {internalServerError, success} from "../../http/responseTemplates.ts";
import {getShift} from "./employeeRecords.ts";
import type {New_Table_Name} from "@prisma/client";


function pointDetToTable(body: PointsDetails): New_Table_Name | Error {
    try {
        return {
            accessCode: body.accessCode,
            employeeName: body.employeeName,
            employeeId: body.employeeId ? Number.parseInt(body.employeeId, 10) : null,
            shiftDate: new Date(body.shiftDate),
            selectedShift: body.selectedShift,
            manualShift: body.manualShift ? body.manualShift : null,
            reason: body.reason,
            comments: body.comments ? body.comments : null,
            email: body.email,
            points: body.points
        };
    } catch (e: any) {
        return new Error(e.toString());
    }
}

function generateEmailBody(data: PointsDetails): string {
    let message = `Hello, ${data.employeeName},\n\n`;
    message += "You have received points. Find attached details:\n";
    message += `Shift Date: ${data.shiftDate}\n`;
    message += `Selected Shift: ${data.selectedShift}\n`;
    message += `Reason: ${data.reason}\n`;
    message += `Comments: ${data.comments || "N/A"}\n\n`;
    message += `Points: ${data.points}\n\n`;
    message += "Thank you,\nStudent Scheduler\n";

    return message;
}

export async function handleIncr(req: Request): Promise<CustomResponse> {
    const emailSubject = "Shift Update Notification";
    const failureMsg = "Failed to send email/insert data in DB";
    let errors: Error[] = [];

    try {

        function populateErr(e: any | Error) {
            if (e instanceof Error) {
                errors.push(e);
            }
        }

        let body: PointsDetails = await req.json();

        new Db(prisma.new_Table_Name, body).send().then(populateErr);
        let email = {
            subject: emailSubject,
            to: body.email,
            text: generateEmailBody(body),
        };

        new Email(email).send().then(populateErr);

        let data = pointDetToTable(body);
        if (data instanceof Error) {
            errors.push(data);
        }

        if (errors.length == 0) {
            console.log(await prisma.new_Table_Name.create({
                data: data
            }))
            return success({
                success: "Email sent and Points inserted in db."
            })
        } else {
            return internalServerError(failureMsg, JSON.stringify({
                email,
                db: body,
                errors: errors.map(i => i.toString())
            }));
        }
    } catch (e: any) {
        return internalServerError(failureMsg, JSON.stringify({
            exception: e.toString(),
            errors: errors.map(i => i.toString()),
        }))
    }
}

export async function handleShifts(req: Request): Promise<CustomResponse> {
    try {
        let url = process.env.GETALL_URL;
        let body = await req.json();
        let value = await getShift(url, body["date"]);

        return success(value);
    } catch (e) {
        return internalServerError(`An error occurred while trying to fetch shift(s): ${e}`);
    }
}

export async function handleShift(req: Request, parts: Record<string, string>): Promise<CustomResponse> {
    try {
        const employeeId = parts["id"];
        const url = process.env.GETALL_URL;
        let body = await req.json();
        let value = await getShift(url, body["date"]);
        let shift = value.AssignedShiftList.find((v) => v.EMPLOYEE_NUMBER == employeeId);
        let resp = shift ? JSON.stringify(shift) : "{}";

        return success(resp);
    } catch (e) {
        return internalServerError(`An error occurred while trying to fetch shift(s): ${e}`);
    }
}
