import type { CustomResponse } from "../../http/response.ts";
import { Db, prisma } from "../../handler/db.ts";
import { type PointsDetails } from "../../handler/utils.ts";
import { Email } from "../../handler/email.ts";
import { internalServerError, success } from "../../http/responseTemplates.ts";
import { getShift } from "./employeeRecords.ts";
import type { New_Table_Name } from "@prisma/client";
import { handleAuth } from "../../auth/handler.ts";
import type { RequestHandler } from "../../http/traits.ts";
import {extractTokenDetails, extractTokenFromHeaders} from "../../auth/token_extractor.ts";

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
      points: body.points,
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

export class IncrHandler implements RequestHandler {
  async handle(
    req: Request,
    _params: Record<string, string>,
  ): Promise<CustomResponse> {
    return this.handleIncr(req);
  }

  async auth(req: Request): Promise<CustomResponse> {
    return handleAuth(req);
  }

  async handleIncr(req: Request): Promise<CustomResponse> {
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
      let token = extractTokenFromHeaders(req.headers);
      if (token) {
        // console.log(extractTokenDetails({ token }));
        body.accessCode = extractTokenDetails({ token })["username"];
      }

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
        let pointD = await prisma.new_Table_Name.create({
          data: data,
        });

        console.debug(pointD);
        return success(
          {
            success: "Email sent and Points inserted in db.",
          },
          req.headers.get("Origin"),
        );
      } else {
        return internalServerError(
          failureMsg,
          JSON.stringify({
            email,
            db: body,
            errors: errors.map((i) => i.toString()),
          }),
        );
      }
    } catch (e: Error | any) {
      if (e instanceof Error) {
        console.debug(e);
      }
      return internalServerError(
        failureMsg,
        JSON.stringify({
          exception: e.toString(),
          errors: errors.map((i) => i.toString()),
        }),
      );
    }
  }
}

export class ShiftsHandler implements RequestHandler {
  async handle(
    req: Request,
    _params: Record<string, string>,
  ): Promise<CustomResponse> {
    return this.handleShifts(req);
  }

  async auth(req: Request): Promise<CustomResponse> {
    return handleAuth(req);
  }

  async handleShifts(req: Request): Promise<CustomResponse> {
    try {
      let url = process.env.SHIFTS_URL;

      let body = await req.json();
      let value = await getShift(url, body["date"]);

      return success(value, req.headers.get("Origin"));
    } catch (e) {
      return internalServerError(
        `An error occurred while trying to fetch shift(s): ${e}`,
      );
    }
  }
}

export class ShiftHandler implements RequestHandler {
  async handle(
    req: Request,
    params: Record<string, string>,
  ): Promise<CustomResponse> {
    return this.handleShift(req, params);
  }

  async auth(req: Request): Promise<CustomResponse> {
    return handleAuth(req);
  }

  async handleShift(
    req: Request,
    parts: Record<string, string>,
  ): Promise<CustomResponse> {
    try {
      const employeeId = parts["id"];
      const url = process.env.SHIFTS_URL;
      let body = await req.json();
      let value = await getShift(url, body["date"]);
      let shift = value.AssignedShiftList.filter(
        (v) => v.EMPLOYEE_NUMBER == employeeId,
      );

      return success(shift, req.headers.get("Origin"));
    } catch (e) {
      return internalServerError(
        `An error occurred while trying to fetch shift(s): ${e}`,
      );
    }
  }
}
