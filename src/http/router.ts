import {fromString, type RequestType} from "./requestType.ts";
import {invalidRequest, methodNotAllowed, notFound} from "./responseTemplates.ts";
import {CustomResponse} from "./response.ts";

type Handler = (req: Request, params: Record<string, string>) => Promise<CustomResponse>;

interface Doc {
    description: string,
    usage?: string,
}

class MatchRouter {
    private matches: { prefix: string; handler: Handler }[] = [];
    private readonly parentRouter: Router;

    constructor(parentRouter: Router, prefix: string, handler: Handler) {
        this.parentRouter = parentRouter;
        this.match(prefix, handler);
    }

    public match(prefix: string, handler: Handler): this {
        this.matches.push({prefix, handler});
        return this;
    }

    public finish(errResp: CustomResponse): Router {
        return this.parentRouter.mergeRight(new Router("", this.matches, errResp));
    }
}

export class Router {
    private routes: Map<RequestType, Map<string, Handler>>;
    private matches: { prefix: string; handler: Handler }[] = [];
    private errorResponse?: CustomResponse;

    private readonly prefix?: string;

    constructor(prefix?: string, matches?: { prefix: string; handler: Handler }[], errorResponse?: CustomResponse) {
        this.routes = new Map();
        this.errorResponse = errorResponse;
        if (matches) {
            this.matches.push(...matches);
        }
        this.prefix = prefix;
    }

    mergeRight(other: Router): Router {
        this.matches.push(...other.matches);
        this.errorResponse = other.errorResponse;

        return this;
    }

    public match(prefix: string, handler: Handler, _doc?: Doc): MatchRouter {
        return new MatchRouter(this, prefix, handler);
    }

    public add(method: RequestType, path: string, handler: Handler, _doc?: Doc): Router {
        if (this.prefix) {
            path = `${this.prefix}/${path}`;
        }

        if (!this.routes.has(method)) {
            this.routes.set(method, new Map());
        }
        this.routes.get(method)?.set(path, handler);

        return this;
    }

    public async handle(req: Request): Promise<CustomResponse> {
        const url = new URL(req.url);
        let resp = await this.handleReq(req, url);
        if (resp.isErr()) {
            return await this.handleMatch(req, url, resp);
        }

        return resp;
    }

    private async handleReq(req: Request, url: URL): Promise<CustomResponse> {
        const method = fromString(req.method);
        if (method === undefined) {
            return invalidRequest(req, `HTTP method: ${req.method} not supported.`);
        }

        const path = url.pathname;

        const methodRoutes = this.routes.get(method);
        if (!methodRoutes) {
            return methodNotAllowed(`Method ${method} not allowed`);
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

        return notFound();
    }

    private async handleMatch(req: Request, url: URL, failingResp: CustomResponse): Promise<CustomResponse> {
        for (const match of this.matches) {
            if (url.pathname.startsWith(match.prefix)) {
                return match.handler(req, {});
            }
        }

        if (this.matches.length == 0) {
            return failingResp;
        }

        return this.errorResponse || notFound(`Route ${req.url} not supported.`);
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
