import nodemailer from 'nodemailer';
import {logError} from "./logger.ts";


interface File {
    filename: string;
    content: string;
    contentType?: string;
    encoding?: string;
}

interface EmailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    attachments?: [File];
}

export async function sendEmail(options: EmailOptions): Promise<void> {
    try {
        // Create a transporter with your email service credentials
        const transporter = nodemailer.createTransport({
            host: 'smtp.hostinger.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASS,
            },
            debug: true,
            logger: true,
        });

        // Define email options
        const mailOptions = {
            from: process.env.EMAIL,
            to: options.to, // List of recipients
            subject: options.subject, // Subject line
            text: options.text, // Plain text body (optional)
            html: options.html, // HTML body (optional)
            attachments: options.attachments,
        };

        // Send the email
        const info = await transporter.sendMail(mailOptions);

        console.debug('Email sent: %s', JSON.stringify(info));
    } catch (error) {
        await logError(`Error sending email: ${error}`);
        throw error;
    }
}

