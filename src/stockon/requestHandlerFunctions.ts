import { sendEmail } from '../email.ts';
import type { EmailOptions } from '../interfaces.ts'; // Import EmailOptions type

export async function generateAndSendOrderData({
    recipient,
    subject,
    message,
    data,
    fileName = 'order_data.csv', // Default name for the CSV file
}: {
    recipient: string;
    subject: string;
    message: string;
    data: Record<string, any>[];
    fileName?: string;
}): Promise<Response | Error> {
    try {
        const csvContent = convertJsonToCsv(data);

        // Prepare the email options
        const emailOptions: EmailOptions = {
            to: recipient,
            subject: subject,
            text: message,
            attachments: [
                {
                    filename: fileName,
                    content: Buffer.from(csvContent, 'utf-8').toString('base64'), // Convert Buffer to base64 string
                    contentType: 'text/csv',
                },
            ],
        };

        // Send the email
        await sendEmail(emailOptions);

        return new Response('Email with CSV file sent successfully!');
    } catch (error) {
        return new Response(`Error generating or sending CSV file: ${error}`);
    }
}

// Convert JSON data to CSV format
function convertJsonToCsv(data: Record<string, any>[]): string {
    if (data.length === 0) {
        return '';
    }

    // Get CSV headers from object keys
    const headers = Object.keys(data[0]).join(',');

    // Convert each row of data to CSV format
    const rows = data.map(row =>
        Object.values(row)
            .map(value => `"${String(value).replace(/"/g, '""')}"`) // Escape double quotes
            .join(',')
    );

    // Combine headers and rows
    return [headers, ...rows].join('\n');
}
