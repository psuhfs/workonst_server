import {createObjectCsvStringifier} from "csv-writer";
import {type OrderDetails} from "../../handler/utils.ts";

export function generateCsvFromItems(
    order_delivery_date: string,
    orderDetails: OrderDetails[]
): string {
    try {
        if (orderDetails.length === 0) {
            console.error("No items to write to CSV.");
            return "";
        }

        const csvWriter = createObjectCsvStringifier({
            header: [
                {id: "item_id", title: "Item ID"},
                {id: "name", title: "Name"},
                {id: "unit_sz", title: "Unit Size"},
                {id: "quantity", title: "Order Quantity"},
                {id: "location", title: "Location"},
                {id: "area", title: "Area"},
                {id: "category", title: "Category"},
            ],
        });

        const dateRow = `Order Delivery Date:,${order_delivery_date}\n`;

        const header = csvWriter.getHeaderString();
        const records = csvWriter.stringifyRecords(orderDetails);

        return dateRow + "\n" + header + records;
    } catch (error) {
        return "";
    }
}
