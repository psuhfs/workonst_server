import nodemailer from 'nodemailer';
import { logError } from './logger.ts';

export interface File {
    filename: string;
    content: string;
    contentType?: string;
    encoding?: string;
}

export interface EmailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    attachments?: [File];
}


export class Email {
    private emailOptions: EmailOptions;

    constructor(emailOptions: EmailOptions) {
        this.emailOptions = emailOptions;
    }

    private createTransporter() {
        return nodemailer.createTransport({
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
    }

    public async send(): Promise<void> {
        try {
            const transporter = this.createTransporter();

            const mailOptions = {
                from: process.env.EMAIL,
                to: this.emailOptions.to,
                subject: this.emailOptions.subject,
                text: this.emailOptions.text,
                html: this.emailOptions.html,
                attachments: this.emailOptions.attachments,
            };

            const info = await transporter.sendMail(mailOptions);

            console.debug('Email sent: %s', JSON.stringify(info));
        } catch (error) {
            await logError(`Error sending email: ${error}`);
            throw error;
        }
    }
}



