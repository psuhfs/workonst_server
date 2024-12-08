import {createObjectCsvStringifier} from 'csv-writer';
import {prisma} from "../handler/db.ts";
import {Email} from "../handler/email.ts";
import type {Webhook} from "../webhook/traits.ts";
import {CustomError} from "../errors/error.ts";
import schedule from 'node-schedule';

interface Data {
    id: number
    accessCode: string | null
    employeeName: string | null
    employeeId: number | null
    shiftDate: Date | null
    selectedShift: string | null
    manualShift: string | null
    reason: string | null
    comments: string | null
    email: string | null
    points: number | null
}


let managerEmail = process.env.MANAGER ? process.env.MANAGER : "";

if (managerEmail.length === 0) {
    throw new Error("Manager email not found in env");
} else {

}

// Fetch data using Prisma
async function fetchData(): Promise<Data[] | Error> {
    try {
        const data = await prisma.new_Table_Name.findMany();
        return JSON.parse(JSON.stringify(data));
    } catch (err: any) {
        console.error('Error fetching data:', err);
        return new Error(err.toString());
    }
}


function generateCsv(data: Data[] | Error): string | Error {
    try {
        if (data instanceof Error) {
            return data;
        }

        console.log(data)

        const csvWriter = createObjectCsvStringifier({
            header: Object.keys(data[0]).map((key) => ({id: key, title: key})),
        });
        return csvWriter.stringifyRecords(data);
    } catch (e: any) {
        return new Error(e.toString());
    }
}

async function sendEmail() {
    let data = await fetchData();
    let csv = generateCsv(data);

    if (csv instanceof Error) {
        return csv;
    }

    await new Email({
        subject: "Defaulters update",
        to: managerEmail,
        text: "Please find the attached csv file for the past week defaulters.",
        attachments: [
            {
                content: Buffer.from(csv).toString("base64"),
                encoding: "base64",
                contentType: "text/csv",
                filename: "defaultersList.csv"
            }
        ]
    })
        .send()
        .then(() => {
            console.log("Email sent");
        });
}

export function startBackgroundTask(webhook: Webhook) {
    // Schedule the task for every Monday at 8 AM ET
    schedule.scheduleJob({ hour: 8, minute: 0, dayOfWeek: 1, tz: "America/New_York" }, async () => {
        console.log("Background task started");
        try {
            const data = await sendEmail();

            if (data instanceof Error) {
                await webhook.send(new CustomError(data));
            }
        } catch (err) {
            console.error("Error in background task:", err);
        }
        console.log("Background task completed");
    });

    console.log("Task scheduled to run every Monday at 8 AM ET");
}
