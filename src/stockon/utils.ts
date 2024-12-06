export interface EmailAttachmentOptions {
    recipient: string;
    subject: string;
    message: string;
    data: Record<string, any>[]; // Array of objects for the Excel data
    fileName?: string; // Optional filename for the Excel file
}
