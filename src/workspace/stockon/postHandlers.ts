import {internalServerError, success} from "../../http/responseTemplates.ts";
import type {CustomResponse} from "../../http/response.ts";
import {type OrderDetails} from "../../handler/utils.ts";
import {prisma} from "../../handler/db.ts";
import {Email} from "../../handler/email.ts";

export async function handleSendEmail(req: Request): Promise<CustomResponse> {
    try {
        // return success("Email sent"); // placeholder

        const body: OrderDetails = await req.json();
        const emailContent = generateEmailBody(body);

        const email = new Email({
            to: body.email,
            subject: "Order Details",
            text: emailContent,
            // html: emailContent // will use if email content does not work
        });

        await email.send().then();

        await prisma.order_data.create({
            data: {
                access_code: body.accessCode,
                email_recipients: body.email,
                order_date: new Date(body.deliveryDate),
                location: body.location,
                order_data: JSON.stringify(body.items),
                file_name: null,
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
    let message = `Hello, ${data.accessCode},\n\n`;
    message += "Please find the attached order data file and a summary table below:\n";
    message += `Location: ${data.location}\n`;
    message += `Delivery Date: ${data.deliveryDate}\n`;

    let tableRows = "";
    for (const item of (Array.isArray(data.items) ? data.items : [])) {
        tableRows += `<tr>
                        <td>${item.Item_ID}</td>
                        <td>${item.Name}</td>
                        <td>${item.Unit_Size}</td>
                        <td>${item.Order_Quantity}</td>
                      </tr>`;
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
