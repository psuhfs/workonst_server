import mysql from "mysql2/promise";
import type { PointsDetails } from "./utils.ts";

export async function insertToDatabase(serializedDetails: PointsDetails) {
    console.log("Inserting into database");

    const connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
    });

    try {
        // Deconstruct the serializedDetails object to get individual fields
        const {
            accessCode,
            employeeName,
            employeeId,
            shiftDate,
            selectedShift,
            manualShift,
            reason,
            comments,
            email,
            points,
        } = serializedDetails;

        // Insert serialized details into a table
        const query = `INSERT INTO ${process.env.TABLE_NAME} 
            (accessCode, employeeName, employeeId, shiftDate, selectedShift, manualShift, reason, comments, email, points) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        // Pass individual values to the query
        await connection.execute(query, [
            accessCode,
            employeeName,
            employeeId,
            shiftDate,
            selectedShift,
            manualShift,
            reason,
            comments,
            email,
            points,
        ]);

        console.log(`Points for ${employeeName} successfully inserted into the database.`);
    } catch (error) {
        throw new Error(`Error inserting data: ${error}`);
    } finally {
        await connection.end();
    }
}
