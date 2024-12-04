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

export interface EmployeeList {
    EmployeeList: Employee[];
}

export interface Employee {
    COMPANY_ID: string;
    W2W_EMPLOYEE_ID: string;
    EMPLOYEE_NUMBER: string;
    FIRST_NAME: string;
    LAST_NAME: string;
    EMAILS: string;
}


export interface ShiftList {
    AssignedShiftList: Shift[];
}

export interface Shift {
    COMPANY_ID: string;
    SHIFT_ID: string;
    PUBLISHED: string;
    W2W_EMPLOYEE_ID: string;
    FIRST_NAME: string;
    LAST_NAME: string;
    EMPLOYEE_NUMBER: string;
    START_DATE: string;
    START_TIME: string;
    END_DATE: string;
    END_TIME: string;
    DURATION: string;
    DESCRIPTION: string;
    POSITION_ID: string;
    POSITION_NAME: string;
    CATEGORY_ID: string;
    LAST_CHANGED_TS: string;
    LAST_CHANGED_BY: string;
}

export function deSerializePointsDetails(details: PointsDetails) {
    // Convert `email` array to a comma-separated string
    const emailString = details.email;

    // Create a copy of the object with the modified email
    const modifiedDetails = { ...details, email: emailString };

    // Serialize the object to a JSON string
    return JSON.stringify(modifiedDetails);
}

export function generateEmailBody(data: PointsDetails): string {
    let message = `Hello, ${data.employeeName},\n\n`;
    message += "You have received points. Find attached details:\n";
    message += `Shift Date: ${data.shiftDate}\n`;
    message += `Selected Shift: ${data.selectedShift}\n`;
    message += `Reason: ${data.reason}\n`;
    message += `Comments: ${data.comments || "N/A"}\n\n`;
    message += `Points: ${data.points}\n\n`;
    message += "Thank you,\nStudent Scheduler\n";

    return message;
}