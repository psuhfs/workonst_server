import { createObjectCsvWriter } from "csv-writer";
import {type OrderDetails} from "../../handler/utils.ts";

async function generateCsvFromItems(orderDetails: OrderDetails) {
    if (!orderDetails.items || orderDetails.items.length === 0) {
        console.error("No items to write to CSV.");
        return;
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
        console.log('CSV file created successfully.');
    } catch (error) {
        console.error('Error writing CSV file:', error);
    }
}