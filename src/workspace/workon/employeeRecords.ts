import TTLCache from '@isaacs/ttlcache';
import type {Employee, EmployeeList, ShiftList} from "../../handler/utils.ts";

// Initialize the cache
const cache = new TTLCache({
    max: 1000,
    ttl: 86400000, // Cache for 1 day
});

/**
 * Makes an HTTP request to a given URL with caching.
 * @param url - The URL to make the request to.
 * @returns The response from the server, either from cache or fresh.
 */
export async function getEmployees(url: string | undefined): Promise<EmployeeList> {
    if (!url) {
        throw "Url not defined";
    }
    const cacheKey = url;

    let cachedData: EmployeeList | undefined = cache.get(cacheKey);
    if (cachedData !== undefined) {
        return cachedData;
    }

    // Make the HTTP request
    const options: RequestInit = {
        method: 'GET',
        headers: {'Content-Type': 'application/json'},
    };

    const response = await fetch(url, options);

    // Parse the response as JSON
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data: EmployeeList = await response.json();

    // Store the response in the cache
    cache.set(cacheKey, data);

    return data;
}

export async function getEmployee(url: string | undefined, id: string): Promise<Employee> {
    if (!url) {
        throw "Url not defined";
    }
    let employees = await getEmployees(url);

    let employee = employees.EmployeeList.find((employee: Employee) => {
        return employee.EMPLOYEE_NUMBER === id;
    });

    if (!employee) {
        throw "Employee not found";
    }

    return employee;
}


function formatDate(dateString: string) {
    const [year, month, day] = dateString.split("-")
    return `${month}/${day}/${year}`
}

export async function getShift(url: string | undefined, date: string): Promise<ShiftList> {
    if (!url) {
        throw "Url not defined";
    }

    let formattedDate = formatDate(date);
    url = url.replace("{{formattedDate}}", formattedDate);

    const cacheKey = url;
    let cachedData: ShiftList | undefined = cache.get(cacheKey);
    if (cachedData !== undefined) {
        return cachedData;
    }
    const options: RequestInit = {
        method: 'GET',
        headers: {'Content-Type': 'application/json'},
    }
    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data: ShiftList = await response.json();
    cache.set(cacheKey, data);

    return data;
}
