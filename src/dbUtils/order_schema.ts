import mongoose from "mongoose";
import {Collections, DBCollection} from "../db/mongoDB.ts";
import type {OrderDetails} from "../handler/utils.ts";

const uri = process.env.MONGO_URI;
await mongoose.connect(uri ? uri : "", {
    dbName: DBCollection.STOCKON
});

const orderSchema = new mongoose.Schema({
    uname: {type: String, required: true},
    email_recipients: {type: String, required: true},
    order_date: {type: String, required: true},
    order_details: [{
        location: {type: String, required: true},
        area: {type: String, required: true},
        category: {type: String, required: true},
        item_id: {type: String, required: true},
        name: {type: String, required: true},
        unit_sz: {type: String, required: true},
        quantity: {type: Number, required: true},
    }]
}, {timestamps: true});

export async function order(uname: string, email_recipients: string, order_date: string, order_details: OrderDetails[]): Promise<boolean> {
    try {
        const newOrder = new ORDER_SCHEMA({uname, email_recipients, order_date, order_details});
        await newOrder.save();
        return true;
    } catch (e: any) {
        if (e.code === 11000) {
            console.error("Error: uname must be unique.");
        } else {
            console.error("Error creating user:", e);
        }

        return false;
    }
}

export const ORDER_SCHEMA = mongoose.model(Collections.ORDERS, orderSchema);