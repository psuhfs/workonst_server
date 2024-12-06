import {fromString, type RequestType} from "./requestType.ts";
import {invalidRequest} from "./defaultErrResp.ts";

type Handler = (req: Request, params: Record<string, string>) => Promise<Response | Error>;

export class Router {
    private routes: Map<RequestType, Map<string, Handler>>;

    constructor() {
        this.routes = new Map();
    }

    public add(method: RequestType, path: string, handler: Handler) {
        if (!this.routes.has(method)) {
            this.routes.set(method, new Map());
        }
        this.routes.get(method)?.set(path, handler);
    }

    public async handle(req: Request): Promise<Response | Error> {
        const method = fromString(req.method);
        if (method === undefined) {
            return invalidRequest(`HTTP method: ${req.method} not supported.`);
        }

        const url = new URL(req.url);
        const path = url.pathname;

        const methodRoutes = this.routes.get(method);
        if (!methodRoutes) {
            return new Response("Method Not Allowed", {status: 405});
        }

        const handler = methodRoutes.get(path);
        if (handler) {
            return handler(req, {});
        }

        // Optional: Fuzzy matching for dynamic routes
        for (const [route, handler] of methodRoutes) {
            const match = this.matchRoute(path, route);
            if (match) {
                return handler(req, match);
            }
        }

        return new Response("Not Found", {status: 404});
    }

    private matchRoute(path: string, route: string): Record<string, string> | null {
        const pathParts = path.split("/").filter(Boolean);
        const routeParts = route.split("/").filter(Boolean);

        if (pathParts.length !== routeParts.length) return null;

        const params: Record<string, string> = {};

        for (let i = 0; i < routeParts.length; i++) {
            if (routeParts[i].startsWith(":")) {
                const paramName = routeParts[i].slice(1);
                params[paramName] = pathParts[i];
            } else if (routeParts[i] !== pathParts[i]) {
                return null;
            }
        }

        return params;
    }
}
