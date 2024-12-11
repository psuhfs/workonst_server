import {internalServerError, success} from "../../http/responseTemplates.ts";
import type {CustomResponse} from "../../http/response.ts";
import {type OrderDetails} from "../../handler/utils.ts";

export async function handleSendEmail(_: Request): Promise<CustomResponse> {
    try {
        return success("Email sent"); // placeholder
    } catch (e) {
        return internalServerError(`An error occurred while trying to send email: ${e}`);
    }
}

function generateEmailBody(data: OrderDetails): string {
    let message = `Hello, ${data.accessCode},\n\n`;
    message += "Please find the attached order data file and a summary table below:\n";
    message += `Location: ${data.location}\n`;
    message += `Delivery Date: ${data.deliveryDate}\n`;
    message += "Thank you,\nStudent Scheduler\n";

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
    message += "\nThank you, \nStudent Scheduler\n";

    return message;
}

