export function notFound(message: string = "Resource not found"): Response {
    const body = JSON.stringify({ error: "Not Found", message });
    return new Response(body, { status: 404, headers: { "Content-Type": "application/json" } });
}

export function invalidRequest(message: string = "Invalid request"): Response {
    const body = JSON.stringify({ error: "Bad Request", message });
    return new Response(body, { status: 400, headers: { "Content-Type": "application/json" } });
}

export function unauthorized(message: string = "Unauthorized access"): Response {
    const body = JSON.stringify({ error: "Unauthorized", message });
    return new Response(body, { status: 401, headers: { "Content-Type": "application/json" } });
}

export function forbidden(message: string = "Forbidden access"): Response {
    const body = JSON.stringify({ error: "Forbidden", message });
    return new Response(body, { status: 403, headers: { "Content-Type": "application/json" } });
}

export function internalServerError(message: string = "Internal server error"): Response {
    const body = JSON.stringify({ error: "Internal Server Error", message });
    return new Response(body, { status: 500, headers: { "Content-Type": "application/json" } });
}
