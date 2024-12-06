import nodemailer from 'nodemailer';
import { logError } from './logger.ts';
import type { File, EmailOptions, DBOptions } from './interfaces.ts';

import mysql from "mysql2/promise";

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

export class Database {
    private options: DBOptions;

    constructor(options: DBOptions) {
        this.options = options;
    }

    private async getConnection() {
        return await mysql.createConnection({
            host: this.options.host,
            user: this.options.user,
            password: this.options.password,
            database: this.options.database,
        });
    }

    public async executeQuery(query: string, params: any[] = []): Promise<Response | Error> {
        const connection = await this.getConnection();
        try {
            const [results] = await connection.execute(query, params);
            console.debug(`Query executed successfully: ${query}`);
            return new Response (JSON.stringify(results));
        } catch (error) {
            throw new Error(`Error executing query: ${error}`);
        } finally {
            await connection.end();
        }
    }

    public async insert(tableName: string, data: Record<string, any>): Promise<void> {
        const columns = Object.keys(data).join(', ');
        const placeholders = Object.keys(data).map(() => '?').join(', ');
        const values = Object.values(data);

        const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`;

        await this.executeQuery(query, values);
        console.debug(`Data inserted into table ${tableName}: ${JSON.stringify(data)}`);
    }

    public async select(
        tableName: string,
        columns: string[] = ['*'], // Specify columns to retrieve, default to all
        conditions: Record<string, any> = {}
    ): Promise<Response | Error> {
        const columnClause = columns.join(', '); // Join column names with commas
        const whereClause = Object.keys(conditions)
            .map(key => `${key} = ?`)
            .join(' AND ');
            
        const values = Object.values(conditions);
    
        const query = `SELECT ${columnClause} FROM ${tableName} ${whereClause ? `WHERE ${whereClause}` : ''}`;
    
        const result = await this.executeQuery(query, values);

        return new Response (JSON.stringify(result));
    }
    

    public async update(
        tableName: string,
        updates: Record<string, any>,
        conditions: Record<string, any>
    ): Promise<void> {
        const setClause = Object.keys(updates)
            .map(key => `${key} = ?`)
            .join(', ');
        const whereClause = Object.keys(conditions)
            .map(key => `${key} = ?`)
            .join(' AND ');

        const query = `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause}`;
        const values = [...Object.values(updates), ...Object.values(conditions)];

        await this.executeQuery(query, values);
        console.debug(`Data updated in table ${tableName}`);
    }

    public async delete(
        tableName: string,
        conditions: Record<string, any>
    ): Promise<void> {
        const whereClause = Object.keys(conditions)
            .map(key => `${key} = ?`)
            .join(' AND ');
        const values = Object.values(conditions);

        const query = `DELETE FROM ${tableName} WHERE ${whereClause}`;

        await this.executeQuery(query, values);
        console.debug(`Data deleted from table ${tableName}`);
    }
}
