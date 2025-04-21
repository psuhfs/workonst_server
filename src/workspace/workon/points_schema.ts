import mongoose from "mongoose";
import {Collections, DBCollection} from "../../handler/utils.ts";

const uri = process.env.MONGO_URI;
await mongoose.connect(uri ? uri : "", {
    dbName: DBCollection.STOCKON
});

const pointsSchema = new mongoose.Schema({
    accessCode: {type: String, required: true},
    employeeName: {type: String, required: true},
    employeeId: {type: String, required: true},
    shiftDate: {type: Date, required: false},
    selectedShift: {type: String, required: true},
    reason: {type: String, required: true},
    comments: {type: String, required: false},
    email: {type: String, required: true},
    points: {type: Number, required: true},
});


export const POINTS_SCHEMA = mongoose.model(Collections.POINTS, pointsSchema);