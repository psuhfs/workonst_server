import { internalServerError, success } from "../../http/responseTemplates.ts";
import type { CustomResponse } from "../../http/response.ts";
import { type OrderDetails } from "../../handler/utils.ts";
import { prisma } from "../../handler/db.ts";
import { Email } from "../../handler/email.ts";
import { generateCsvFromItems } from "./generateOrderFile.ts";
import type { RequestHandler } from "../../http/traits.ts";
import { handleAuth } from "../../auth/handler.ts";

// TODO: needs design change in DB

export class StockEmailSender implements RequestHandler {
  async handle(req: Request): Promise<CustomResponse> {
    return this.handleSendEmail(req);
  }

  async auth(req: Request): Promise<CustomResponse> {
    return handleAuth(req);
  }

  async handleSendEmail(req: Request): Promise<CustomResponse> {
    try {
      const body: OrderDetails = await req.json();
      const emailContent = generateEmailBody(body);
      const csvFile = generateCsvFromItems(body);

      let email = new Email({
        to: body.email,
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

      // prisma.table_name.operation
      await prisma.order_data.create({
        data: {
          access_code: body.accessCode,
          email_recipients: body.email,
          order_date: new Date(body.deliveryDate),
          location: body.location,
          order_data: JSON.stringify(body.items),
          file_name: "order_data.csv",
          file_size: csvFile.length,
          file_type: "text/csv",
          file_content: Uint8Array.from(Buffer.from(csvFile)),
        },
      });

      return success(
        `Email has been sent to ${body.accessCode} and stored in database`,
      );
    } catch (e) {
      return internalServerError(
        `An error occurred while trying to send email: ${e}`,
      );
    }
  }
}

function generateEmailBody(data: OrderDetails): string {
  let message = `Hello, <strong>${data.accessCode}</strong>,\n\n`;
  message +=
    "Please find the attached order data file and a summary table below:\n";
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
