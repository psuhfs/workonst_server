import * as XLSX from 'xlsx';
import { sendEmail } from '../email.ts';
import type { EmailAttachmentOptions } from '../stockon/utils.ts'; // Import EmailAttachmentOptions type)

export async function generateAndSendExcel({
    recipient,
    subject,
    message,
    data,
    fileName = 'order_data.xlsx', // Default file name if not provided
}: EmailAttachmentOptions): Promise<void> {
    try {
        // Create a new workbook and worksheet from the data
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(data);

        // Add the worksheet to the workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

        // Write the workbook to a buffer
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

        console.log('Email with Excel file sent successfully!');
    } catch (error) {
        console.error('Error generating or sending Excel file:', error);
        throw error;
    }
}
