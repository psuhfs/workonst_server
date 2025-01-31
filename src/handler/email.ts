import nodemailer from "nodemailer";
import type { Sendable } from "./traits.ts";

// TODO: make this typesafe

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

export class Email implements Sendable {
  private readonly emailOptions: EmailOptions;

  constructor(emailOptions: EmailOptions) {
    this.emailOptions = emailOptions;
  }

  attach(file: File): this {
    if (!this.emailOptions.attachments) {
      this.emailOptions.attachments = [file];
    } else {
      this.emailOptions.attachments.push(file);
    }
    return this;
  }

  async send(): Promise<void | Error> {
    try {
      // Create a transporter with your email service credentials
      const transporter = nodemailer.createTransport({
        host: "smtp.hostinger.com",
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
        to: this.emailOptions.to, // List of recipients
        subject: this.emailOptions.subject, // Subject line
        text: this.emailOptions.text, // Plain text body (optional)
        html: this.emailOptions.html, // HTML body (optional)
        attachments: this.emailOptions.attachments,
      };

      // Send the email
      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent to: %s", this.emailOptions.to);
      console.debug(JSON.stringify(info));
    } catch (error: any) {
      return new Error(error.toString());
    }
  }
}
