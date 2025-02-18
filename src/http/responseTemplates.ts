import {CustomResponse} from "./response.ts";
import {CustomError} from "../errors/error.ts";

export function notFound(message: string = "not found"): CustomResponse {
    const body = JSON.stringify({error: "Not Found", message});
    return new CustomResponse(
        new Response(body, {
            status: 404,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Credentials": "true",
            },
        }),
        new CustomError(new Error(body)),
    );
}

export function methodNotAllowed(
    message: string = "Method not allowed",
): CustomResponse {
    const body = JSON.stringify({error: "Method Not Allowed", message});
    return new CustomResponse(
        new Response(body, {
            status: 405,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Credentials": "true",
            },
        }),
        new CustomError(new Error(body)),
    );
}

export function invalidRequest(
    url: string,
    message: string = "Invalid request",
): CustomResponse {
    const body = JSON.stringify({error: "Bad Request", message, url: url});
    return new CustomResponse(
        new Response(body, {
            status: 405,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Credentials": "true",
            },
        }),
        new CustomError(new Error(body)),
    );
}

export function unauthorized(
    message: string = "Unauthorized access",
): CustomResponse {
    const body = JSON.stringify({error: "Unauthorized", message});
    return new CustomResponse(
        new Response(body, {
            status: 401,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Credentials": "true",
            },
        }),
        new CustomError(new Error(body)),
    );
}

export function forbidden(
    message: string = "Forbidden access",
): CustomResponse {
    const body = JSON.stringify({error: "Forbidden", message});
    return new CustomResponse(
        new Response(body, {
            status: 403,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Credentials": "true",
            },
        }),
        new CustomError(new Error(body)),
    );
}

export function internalServerError(
    message: string = "Internal server error",
    customError?: string,
): CustomResponse {
    const body = JSON.stringify({error: "Internal Server Error", message});
    const errBody = customError ? customError : body;

    return new CustomResponse(
        new Response(body, {
            status: 500,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Credentials": "true",
            },
        }),
        new CustomError(new Error(errBody)),
    );
}

export function success(data: any, origin: string | null): CustomResponse {
    let resp = new CustomResponse(
        new Response(JSON.stringify(data), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Credentials": "true",
            },
        }),
    );
    if (origin) {
        resp.getResponse().headers.set("Access-Control-Allow-Origin", origin);
    }
    return resp;
}

export function successHeaders(
    data: any,
    appendHeaders: Record<string, string>,
): CustomResponse {
    return new CustomResponse(
        new Response(JSON.stringify(data), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                ...appendHeaders,
            },
        }),
    );
}
