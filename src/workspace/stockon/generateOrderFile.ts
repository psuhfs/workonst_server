import { createObjectCsvStringifier } from "csv-writer";
import { type OrderDetails } from "../../handler/utils.ts";

export function generateCsvFromItems(orderDetails: OrderDetails): string {
  try {
    if (!orderDetails.items || orderDetails.items.length === 0) {
      console.error("No items to write to CSV.");
      return "";
    }

    const csvWriter = createObjectCsvStringifier({
      header: [
        { id: "Item_ID", title: "Item ID" },
        { id: "Name", title: "Name" },
        { id: "Unit_Size", title: "Unit Size" },
        { id: "Order_Quantity", title: "Order Quantity" },
      ],
    });
    return csvWriter.stringifyRecords(orderDetails.items);
  } catch (error) {
    return "";
  }
}
