import {internalServerError, success, unauthorized} from "../../http/responseTemplates.ts";
import type {CustomResponse} from "../../http/response.ts";
import {type OrderDetails} from "../../handler/utils.ts";
import {prisma} from "../../handler/db.ts";
import {Email} from "../../handler/email.ts";
import {generateCsvFromItems} from "./generateOrderFile.ts";
import type {RequestHandler} from "../../http/traits.ts";
import {extractTokenDetails, extractTokenFromCookie, handleAuth} from "../../auth/handler.ts";
import type Stockon from "../../db/stockon.ts";
import {DateTime} from "luxon";

let managerEmail = process.env.MANAGER || "abg6200@psu.edu";

export class StockEmailSender implements RequestHandler {
    async handle(req: Request, _: Record<string, string>, db: Stockon | null): Promise<CustomResponse> {
        if (!db) {
            // Maybe we should exit here
            return internalServerError("Database not initialized.");
        }
        return this.handleSendEmail(req, db);
    }

    async auth(req: Request): Promise<CustomResponse> {
        return handleAuth(req);
    }

    async handleSendEmail(req: Request, db: Stockon): Promise<CustomResponse> {
        try {
            let body: [OrderDetails] = await req.json();
            let access_code = extractAccessCode(req.headers.get("cookie"));
            if (!access_code) {
                return unauthorized();
            }

            const curTime = DateTime.now().setZone("America/New_York").toFormat("yyyy-MM-dd HH:mm:ss ZZZZ");

            const emailContent = generateEmailBody(body, access_code, curTime);
            const csvFile = generateCsvFromItems(body);

            let ref_email = access_code.endsWith("@psu.edu") ? access_code : `${access_code}@psu.edu`;
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
                orders: body
            };

            try {
                // Ensure the database connection exists
                if (!db.db) {
                    console.error('Database connection is not established');
                    return internalServerError("Database connection failed");
                }

                // Get the collection with explicit error handling
                const collection = db.db.collection('orders');
                if (!collection) {
                    console.error('Orders collection not found');
                    return internalServerError("Collection not found");
                }

                // Perform insertion with comprehensive logging
                const insertOneResult = await collection.insertOne(order);
                
                // Validate insertion result
                if (!insertOneResult) {
                    console.error('Insert operation returned undefined');
                    return internalServerError("Failed to insert data in the database");
                }

                console.log('Order inserted successfully:', insertOneResult);
            } catch (insertError) {
                console.error('MongoDB Insertion Error:', insertError);
                return internalServerError(`Database insertion failed: ${insertError.message}`);
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

function extractAccessCode(cookies: string | null): string | null {
    if (!cookies) return null;

    let token_info = extractTokenDetails({token: extractTokenFromCookie(cookies)});
    let referer: string = token_info["username"];
    return `${referer}@psu.edu`;
}

function generateEmailBody(data: [OrderDetails], accessCode: string, time: Date): string {
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
