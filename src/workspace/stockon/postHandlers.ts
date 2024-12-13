import {internalServerError, success} from "../../http/responseTemplates.ts";
import type {CustomResponse} from "../../http/response.ts";
import {type OrderDetails} from "../../handler/utils.ts";
import {prisma} from "../../handler/db.ts";
import {Email} from "../../handler/email.ts";
import { generateCsvFromItems } from "./generateOrderFile.ts";

export async function handleSendEmail(req: Request): Promise<CustomResponse> {
    try {
        const body: OrderDetails = await req.json();
        const emailContent = generateEmailBody(body);
        const csvFile = await generateCsvFromItems(body);

        const email = new Email({
            to: body.email,
            subject: "Order Details",
            // text: emailContent, // will use if html does not work
            html: emailContent
        });

        await email.send().then();

        await prisma.order_data.create({
            data: {
                access_code: body.accessCode,
                email_recipients: body.email,
                order_date: new Date(body.deliveryDate),
                location: body.location,
                order_data: JSON.stringify(body.items),
                file_name: "order_data.csv",
                file_size: null,
                file_type: null,
                file_content: null
            }
        });

        return success(`Email has been sent to ${body.accessCode} and stored in database`);

    } catch (e) {
        return internalServerError(`An error occurred while trying to send email: ${e}`);
    }
}

function generateEmailBody(data: OrderDetails): string {
    let message = `Hello, <strong>${data.accessCode}</strong>,\n\n`;
    message += "Please find the attached order data file and a summary table below:\n";
    message += `<p><strong>Location:</strong></p>: ${data.location}\n`;
    message += `<p><strong>Delivery Date</strong></p>: ${data.deliveryDate}\n`;

    let tableRows = "";
    if (data.items && data.items.length > 0) {
        for (const item of data.items) {
            tableRows += `<tr>
                            <td>${item.Item_ID}</td>
                            <td>${item.Name}</td>
                            <td>${item.Unit_Size}</td>
                            <td>${item.Order_Quantity}</td>
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

