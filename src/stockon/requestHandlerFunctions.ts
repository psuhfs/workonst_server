import * as XLSX from 'xlsx';
import { sendEmail } from '../email.ts';
import type { EmailAttachmentOptions } from '../stockon/utils.ts'; // Import EmailAttachmentOptions type)

export async function generateAndSendOrderData({
    recipient,
    subject,
    message,
    data,
    fileName = 'order_data.xlsx', // default name
}: EmailAttachmentOptions): Promise<Response | Error> {
    try {
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(data);

        // Add the worksheet to the workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

        // workbook to buffer
        const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

        // Send email with the Excel attachment
        await sendEmail({
            to: recipient,
            subject: subject,
            text: message,
            attachments: [
                {
                    filename: fileName,
                    content: buffer,
                    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                },
            ],
        });
        return new Response('Email with Excel file sent successfully!');

    } catch (error) {
        return new Response(`Error generating or sending Excel file: ${error}`);
    }
}
