import { env } from 'process';

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

export interface DBOptions {
    tool: string;
    host: string;
    user: string;
    password: string;
    database: string;
}

export interface PointsDetails {
    accessCode: string;
    employeeName: string;
    employeeId?: string;
    shiftDate: string;
    selectedShift: string;
    manualShift?: string;
    reason: string;
    comments?: string;
    email: string;
    points: number;
}