import {
  internalServerError,
  invalidRequest,
  success,
  unauthorized,
} from "../../http/responseTemplates.ts";
import type { CustomResponse } from "../../http/response.ts";
import { type OrderDetails } from "../../handler/utils.ts";
import { Email } from "../../handler/email.ts";
import { generateCsvFromItems } from "./generateOrderFile.ts";
import type { RequestHandler } from "../../http/traits.ts";
import {
  extractTokenDetails,
  extractTokenFromCookie,
  handleAuth,
} from "../../auth/handler.ts";
import { Stockon } from "../../db/stockon.ts";
import { DateTime } from "luxon";
import { categoriesJson } from "../../static.ts";
import { sha256Hash } from "../../auth/hasher.ts";

let managerEmail = process.env.MANAGER || "abg6200@psu.edu";

export class StockEmailSender implements RequestHandler {
  async handle(
    req: Request,
    _: Record<string, string>,
  ): Promise<CustomResponse> {
    return this.handleSendEmail(req);
  }

  async auth(req: Request): Promise<CustomResponse> {
    return handleAuth(req);
  }

  async handleSendEmail(req: Request): Promise<CustomResponse> {
    try {
      let body: [OrderDetails] = await req.json();
      if (!verifyBody(body)) {
        return invalidRequest(
          req.url,
          `Hash for some of the items did not match.`,
        );
      }
      let mongo_uri = process.env.MONGO_URI; // should be mongodb://<uname>:<pw>@<host>:<port>

      // TODO(perf): we should not connect to db per req, we can store instance of db outside
      let db = await Stockon.init(mongo_uri ? mongo_uri : "");

      let access_code = extractAccessCode(req.headers);
      if (!access_code) {
        return unauthorized();
      }

      const curTime = DateTime.now()
        .setZone("America/New_York")
        .toFormat("yyyy-MM-dd HH:mm:ss ZZZZ");

      const emailContent = generateEmailBody(body, access_code, curTime);
      const csvFile = generateCsvFromItems(body);

      let ref_email = access_code.endsWith("@psu.edu")
        ? access_code
        : `${access_code}@psu.edu`;
      let emails = [managerEmail, ref_email].join(", ");

      let email = new Email({
        to: emails,
        subject: "Order Details",
        // text: emailContent, // will use if html does not work
        html: emailContent,
      });

      if (csvFile.length > 0) {
        email = email.attach({
          filename: "order_data.csv",
          content: csvFile,
        });
      }

      await email.send();

      let order = {
        access_code: access_code,
        email_recipients: emails,
        order_date: curTime.toString(),
        orders: body,
      };

      try {
        // Ensure the database connection exists
        if (!db.db) {
          console.error("Database connection is not established");
          return internalServerError("Database connection failed");
        }

        // Get the collection with explicit error handling
        const collection = db.db.collection("orders");
        if (!collection) {
          console.error("Orders collection not found");
          return internalServerError("Collection not found");
        }

        // Perform insertion with comprehensive logging
        const insertOneResult = await collection.insertOne(order);

        // Validate insertion result
        if (!insertOneResult) {
          console.error("Insert operation returned undefined");
          return internalServerError("Failed to insert data in the database");
        }

        console.log("Order inserted successfully:", insertOneResult);
      } catch (insertError: any) {
        console.error("MongoDB Insertion Error:", insertError);
        return internalServerError(
          `Database insertion failed: ${insertError.message}`,
        );
      }

      return success(
        `Email has been sent to ${emails} and stored in database`,
        req.headers.get("Origin"),
      );
    } catch (e) {
      return internalServerError(
        `An error occurred while trying to send email: ${e}`,
      );
    }
  }
}

function extractAccessCode(headers: Headers): string | null {
  let token = headers.get("Authorization");
  if (token === null) {
    let cookie = headers.get("cookie");
    if (cookie === null) {
      return null;
    }
    token = extractTokenFromCookie(cookie);
  } else {
    token = token.replace("Bearer ", "");
  }
  if (!token) return null;

  let token_info = extractTokenDetails({
    token,
  });
  let referer: string = token_info["username"];
  return `${referer}@psu.edu`;
}

function generateEmailBody(
  data: [OrderDetails],
  accessCode: string,
  time: Date,
): string {
  let message = `Hello, <strong>${accessCode}</strong>,\n\n`;
  message +=
    "Please find the attached order data file and a summary table below:\n";
  message += `<p><strong>Delivery Date</strong></p>: ${time}\n`;

  let tableRows = "";
  if (data.length > 0) {
    for (const item of data) {
      tableRows += `<tr>
                            <td>${item.item_id}</td>
                            <td>${item.name}</td>
                            <td>${item.unit_sz}</td>
                            <td>${item.quantity}</td>
                          </tr>`;
    }
  }
  const orderTable = `<table border='1'>
                          <thead>
                              <tr>
                                  <th>Item ID</th>
                                  <th>Name</th>
                                  <th>Unit Size</th>
                                  <th>Order Quantity</th>
                              </tr>
                          </thead>
                          <tbody>
                              ${tableRows}
                          </tbody>
                        </table>`;

  message += orderTable;
  message += "Thank you,\nStudent Scheduler\n";

  return message;
}

function verifyBody(_orders: [OrderDetails]): boolean {
  return true;
/*
TODO(comment): This is perfectly working code, but just to simplify overall code, we are skipping this feature for now.

  let schema = categoriesJson();
  for (let i = 0; i < orders.length; i++) {
    if (!orders[i].hash) {
      return false;
    }

    let areas: [any] = schema[orders[i].location]["areas"];
    let area: any | null = null;

    for (let j = 0; j < areas.length; j++) {
      if (orders[i].area == areas[j]["name"]) {
        area = areas[j];
        break;
      }
    }
    if (!area) {
      return false;
    }
    let category = area["info"][orders[i].category];
    let hash = sha256Hash(JSON.stringify(category));

    if (hash != orders[i].hash) {
      return false;
    }
  }
  return true;*/
}
