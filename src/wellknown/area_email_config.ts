import {StockOnCategories} from "../handler/utils.ts";

export interface LocationEmailConfig {
    [location: string]: string[];
}

// Default configuration - can be overridden by environment variables
const defaultLocationEmails: LocationEmailConfig = {
    [StockOnCategories.Stacks]: [],
    [StockOnCategories.Biscotti]: [],
    [StockOnCategories.Outpost]: [],
    [StockOnCategories.Provisions]: [],
};

// Parse location email configuration from environment variables
// Format: LOCATION_EMAIL_<LOCATION>=email1@example.com,email2@example.com
function loadLocationEmailsFromEnv(): LocationEmailConfig {
    const config: LocationEmailConfig = {...defaultLocationEmails};

    for (const [key, value] of Object.entries(process.env)) {
        if (key.startsWith("LOCATION_EMAIL_") && value) {
            const locationFromEnv = key.replace("LOCATION_EMAIL_", "");

            // Find matching location in config (case-insensitive)
            const matchingLocation = Object.keys(config).find(
                loc => loc.toLowerCase() === locationFromEnv.toLowerCase()
            );

            if (matchingLocation) {
                // Parse comma-separated emails
                config[matchingLocation] = value
                    .split(",")
                    .map(email => email.trim())
                    .filter(email => email.length > 0);
            }
        }
    }

    return config;
}

export const locationEmailConfig = loadLocationEmailsFromEnv();

/**
 * Get email addresses for a specific location
 * @param location - The location (e.g., "Stacks", "Biscotti", "Outpost", "Provisions")
 * @returns Array of email addresses
 */
export function getEmailsForLocation(location: string): string[] {
    return locationEmailConfig[location] || [];
}

/**
 * Get all unique email addresses for a list of orders
 * @param orders - Array of orders with location
 * @returns Array of unique email addresses
 */
export function getEmailsForOrders(orders: { location: string }[]): string[] {
    const emailSet = new Set<string>();

    for (const order of orders) {
        const emails = getEmailsForLocation(order.location);
        emails.forEach(email => emailSet.add(email));
    }

    return Array.from(emailSet);
}
