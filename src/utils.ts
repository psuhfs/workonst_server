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