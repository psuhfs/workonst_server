import { createObjectCsvWriter } from "csv-writer";
import {type OrderDetails} from "../../handler/utils.ts";
import { CustomResponse } from "../../http/response.ts";
import { internalServerError, success } from "../../http/responseTemplates.ts";

export async function generateCsvFromItems(orderDetails: OrderDetails): Promise<CustomResponse> {
    if (!orderDetails.items || orderDetails.items.length === 0) {
        console.error("No items to write to CSV.");
        return internalServerError("No items to write to CSV.");
    }

    const csvWriter = createObjectCsvWriter({
        path: 'order_items.csv',
        header: [
            { id: 'Item_ID', title: 'Item ID' },
            { id: 'Name', title: 'Name' },
            { id: 'Unit_Size', title: 'Unit Size' },
            { id: 'Order_Quantity', title: 'Order Quantity' }
        ]
    });

    try {
        await csvWriter.writeRecords(orderDetails.items);
        return success("CSV file created successfully.");
    } catch (error) {
        return internalServerError(`Error writing CSV file: ${error}`);
    }
}