import type {Token} from "./model.ts";
import jwt from "jsonwebtoken";

export function extractTokenFromHeaders(headers: Headers): string | null {
    let token = headers.get("Authorization");
    if (token === null) {
        let cookie = headers.get("cookie");
        if (cookie === null) {
            return null;
        }
        token = extractTokenFromCookie(cookie);
    } else {
        token = token.replace("Bearer ", "");
    }
    return token;
}

export function extractTokenFromCookie(cookie: string) {
    let token = cookie.split(";").find((c) => c.includes("token"));
    if (token === undefined) {
        return "";
    }
    return token.split("=")[1];
}

export function extractTokenDetails(token: Token): any {
    try {
        return jwt.verify(token.token, process.env.JWT);
    } catch (e) {
        return undefined;
    }
}
