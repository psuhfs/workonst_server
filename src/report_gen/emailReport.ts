import {createObjectCsvStringifier} from 'csv-writer';
import {prisma} from "../handler/db.ts";
import {Email} from "../handler/email.ts";
import type {Webhook} from "../webhook/traits.ts";
import {CustomError} from "../errors/error.ts";
import schedule from 'node-schedule';

interface Data {
    id: number;
    accessCode: string | null;
    employeeName: string | null;
    employeeId: number | null;
    shiftDate: Date | null;
    selectedShift: string | null;
    manualShift: string | null;
    reason: string | null;
    comments: string | null;
    email: string | null;
    points: number | null;
}

let managerEmail = process.env.MANAGER || "";
if (managerEmail.length === 0) {
    throw new Error("Manager email not found in env");
}

// Fetch data from the past 7 days
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

function aggregatePoints(data: Data[]): Map<number, { name: string; email: string; points: number }> {
    const pointsMap = new Map<number, { name: string; email: string; points: number }>();
    for (const record of data) {
        if (!record.employeeId || !record.points) continue;

        const current = pointsMap.get(record.employeeId) || {
            name: record.employeeName || '',
            email: record.email || '',
            points: 0
        };
        pointsMap.set(record.employeeId, {
            name: record.employeeName || '',
            email: record.email || '',
            points: current.points + record.points,
        });
    }
    return pointsMap;
}

function generateHtmlTable(pointsMap: Map<number, { name: string; email: string; points: number }>): string {
    const rows = Array.from(pointsMap.values())
        .filter(entry => entry.points >= 5)
        .map(entry => `
            <tr>
                <td>${entry.name}</td>
                <td>${entry.email}</td>
                <td>${entry.points}</td>
            </tr>
        `)
        .join('');

    if (!rows) return '';

    return `
        <table border="1" style="border-collapse: collapse; width: 100%;">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Points</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
    `;
}

async function sendEmail() {
    const data = await fetchData();
    if (data instanceof Error) return data;

    const csv = generateCsv(data);

    if (csv instanceof Error) return csv;

    const pointsMap = aggregatePoints(data);
    const htmlTable = generateHtmlTable(pointsMap);

    const emailContent = htmlTable
        ? `
            <p>Here is the list of employees with points >= 5:</p>
            ${htmlTable}
        `
        : '<p>No employees have accumulated 5 or more points in the past week.</p>';

    await new Email({
        subject: "Defaulters update",
        to: managerEmail,
        text: "Please find the attached CSV file for the past week's defaulters.",
        html: emailContent,
        attachments: [
            {
                content: Buffer.from(csv).toString("base64"),
                encoding: "base64",
                contentType: "text/csv",
                filename: "defaultersList.csv",
            },
        ],
    })
        .send()
        .then(() => {
            console.log("Email sent");
        });
}

export async function startBackgroundTask(webhook: Webhook) {
    console.log("Background task started");

    schedule.scheduleJob({hour: 8, minute: 0, dayOfWeek: 1, tz: "America/New_York"}, async () => {
        console.log("Background task started");
        try {
            const result = await sendEmail();
            if (result instanceof Error) {
                await webhook.send(new CustomError(result));
            }
        } catch (err) {
            console.error("Error in background task:", err);
        }
        console.log("Background task completed");
    });

    console.log("Task scheduled to run every Monday at 8 AM ET");
}
