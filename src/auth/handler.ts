import type {CustomResponse} from "../http/response.ts";
import {
    internalServerError,
    success,
    successHeaders,
    unauthorized,
} from "../http/responseTemplates.ts";
import jwt from "jsonwebtoken";
import type {Token} from "./model.ts";
import {prisma} from "../handler/db.ts";
import {sha256Hash} from "./hasher.ts";
import type {RequestHandler} from "../http/traits.ts";
import {extractTokenDetails, extractTokenFromHeaders} from "./token_extractor.ts";

interface AuthModel {
    username: string;
    password: string;
    emailid?: string;
}

// TODO: should maintain a map
export async function handleAuth(req: Request): Promise<CustomResponse> {
    try {
        let token = extractTokenFromHeaders(req.headers);
        if (!token) {
            return unauthorized("No token provided.");
        }
        let authResp = await processAuth(
            {token},
            req.headers.get("Origin"),
        );
        if (!authResp.getResponse().ok) {
            return authResp;
        }
        return successHeaders(
            {message: "Auth Successful."},
            {"Access-Control-Allow-Origin": `${req.headers.get("Origin")}`},
        );
    } catch (e: any) {
        return internalServerError("Unable to process auth request.", e.toString());
    }
}

export async function handleAuthSignin(req: Request): Promise<CustomResponse> {
    try {
        let body: AuthModel = await req.json();
        let origin = req.headers.get("Origin");
        return await processAuthSignin(body, origin);
    } catch (e: any) {
        return internalServerError(
            "Unable to process auth signin request.",
            e.toString(),
        );
    }
}

export class SignUpHandler implements RequestHandler {
    async handle(
        req: Request,
        _params: Record<string, string>,
    ): Promise<CustomResponse> {
        return handleAuthSignup(req);
    }

    async auth(req: Request): Promise<CustomResponse> {
        return success("Blah", req.headers.get("Origin"));
    }
}

export class IsAuthenticatedHandler implements RequestHandler {
    async handle(
        req: Request,
        _params: Record<string, string>,
    ): Promise<CustomResponse> {
        let resp = await handleAuth(req);
        let origin = req.headers.get("Origin");
        origin = origin ? origin : "*";
        resp.getResponse().headers.set("access-control-allow-origin", origin);
        resp.getResponse().headers.set("Access-Control-Allow-Credentials", "true");
        return resp;
    }

    async auth(req: Request): Promise<CustomResponse> {
        return success("Blah", req.headers.get("Origin"));
    }
}

export class SignInHandler implements RequestHandler {
    async handle(
        req: Request,
        _params: Record<string, string>,
    ): Promise<CustomResponse> {
        return handleAuthSignin(req);
    }

    async auth(req: Request): Promise<CustomResponse> {
        return success("Blah", req.headers.get("Origin"));
    }
}

export async function handleAuthSignup(req: Request): Promise<CustomResponse> {
    try {
        let body: AuthModel = await req.json();
        let token = extractTokenFromHeaders(req.headers);
        if (token === null) {
            return unauthorized("No token provided.");
        }
        return await processAuthSignup(body, req.headers.get("Origin"), {token});
    } catch (e: any) {
        return internalServerError(
            "Unable to process auth signup request.",
            e.toString(),
        );
    }
}

async function processAuth(
    body: Token,
    origin: string | null,
): Promise<CustomResponse> {
    if (verifyToken(body)) {
        return success(
            {
                message: "Auth Successful.",
            },
            origin,
        );
    } else {
        return unauthorized();
    }
}

async function processAuthSignin(
    body: AuthModel,
    origin: string | null,
): Promise<CustomResponse> {
    body.password = sha256Hash(body.password);

    let val = await prisma.crew_leaders.findUnique({
        where: {
            username: body.username,
            password: body.password,
        },
    });

    if (val === null) {
        return unauthorized("Invalid username or password.");
    }

    const token = genToken(body);
    let headers = {
        "Set-Cookie": `token=${token.token}; Path=/; SameSite=None; Max-Age=36000`,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": "true",
    };
    if (origin !== null) {
        headers["Access-Control-Allow-Origin"] = origin;
    }
    return successHeaders(token, headers);
}

async function processAuthSignup(
    body: AuthModel,
    origin: string | null,
    token: Token,
): Promise<CustomResponse> {
    let details = extractTokenDetails(token);

    if (details === undefined) {
        return unauthorized("Invalid signup details.");
    }
    let referer: string = details["username"];
    let val = await prisma.crew_leaders.findUnique({
        where: {
            username: referer,
        },
    });

    if (val === null) {
        return unauthorized("Invalid signup details.");
    }

    await prisma.crew_leaders.create({
        data: {
            username: body.username,
            password: sha256Hash(body.password),
            emailid: body.emailid
                ? body.emailid
                : `${body.username}@psu.edu`,
        },
    });

    return success({message: "Signup successful."}, origin);
}

function genToken(body: AuthModel): Token {
    let token = jwt.sign(
        {pw: body.password, username: body.username},
        process.env.JWT,
        {expiresIn: "10h"},
    );
    return {
        token,
    };
}

function verifyToken(token: Token): boolean {
    try {
        return !!extractTokenDetails(token);
    } catch (e) {
        return false;
    }
}
