import { fromString, type RequestType } from "./requestType.ts";
import { invalidRequest, notFound, success } from "./responseTemplates.ts";
import { CustomResponse } from "./response.ts";
import type { RequestHandler } from "./traits.ts";
import type Stockon from "../db/stockon.ts";

type Handler = (
  req: Request,
  params: Record<string, string>,
) => Promise<CustomResponse>;

interface Doc {
  description: string;
  usage?: string;
}

class MatchesHandler implements RequestHandler {
  constructor(private readonly handler: Handler) {
    this.handler = handler;
  }

  async handle(
    req: Request,
    params: Record<string, string>,
  ): Promise<CustomResponse> {
    return this.handler(req, params);
  }

  async auth(req: Request): Promise<CustomResponse> {
    return success("Blah", req.headers.get("Origin"));
  }
}

class MatchRouter {
  private matches: { prefix: string; handler: Handler }[] = [];
  private readonly parentRouter: Router;

  constructor(parentRouter: Router, prefix: string, handler: Handler) {
    this.parentRouter = parentRouter;
    this.match(prefix, handler);
  }

  public match(prefix: string, handler: Handler): this {
    this.matches.push({ prefix, handler });
    return this;
  }

  public finish(errResp: CustomResponse): Router {
    let newMatches = [];
    for (const i of this.matches) {
      newMatches.push({
        prefix: i.prefix,
        handler: new MatchesHandler(i.handler),
      });
    }
    return this.parentRouter.mergeRight(new Router("", newMatches, errResp));
  }
}

export class Router {
  private routes: Map<RequestType, Map<string, RequestHandler>>;
  private matches: { prefix: string; handler: RequestHandler }[] = [];
  private errorResponse?: CustomResponse;

  private readonly prefix?: string;

  constructor(
    prefix?: string,
    matches?: {
      prefix: string;
      handler: RequestHandler;
    }[],
    errorResponse?: CustomResponse,
  ) {
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

  public add(
    method: RequestType,
    path: string,
    handler: RequestHandler,
    _doc?: Doc,
  ): Router {
    if (this.prefix) {
      path = `${this.prefix}/${path}`;
    }

    if (!this.routes.has(method)) {
      this.routes.set(method, new Map());
    }
    this.routes.get(method)?.set(path, handler);

    return this;
  }

  public async handle(req: Request, db: Stockon | null): Promise<CustomResponse> {
    const url = new URL(req.url);
    let resp = await this.handleReq(req, url, db);
    if (resp === null) {
      return await this.handleMatch(req, url, db);
    }

    return resp;
  }

  private async handleReq(
    req: Request,
    url: URL,
    db: Stockon | null,
  ): Promise<CustomResponse | null> {
    const method = fromString(req.method);
    if (method === undefined) {
      return invalidRequest(req, `HTTP method: ${req.method} not supported.`);
    }

    const path = url.pathname;

    const methodRoutes = this.routes.get(method);
    if (!methodRoutes) {
      return null;
    }
/*
    const handler = methodRoutes.get(path);
    if (handler) {
      let auth = await handler.auth(req);
      if (auth.isErr()) {
        return auth;
      }
      return handler.handle(req, {});
    }*/

    // Optional: Fuzzy matching for dynamic routes
    for (const [route, handler] of methodRoutes) {
      const match = this.matchRoute(path, route);
      if (match) {
        let auth = await handler.auth(req);
        if (auth.isErr()) {
          return auth;
        }
        return handler.handle(req, match, db);
      }else {
        console.log("No match for", path, route);
      }
    }

    return null;
  }

  private async handleMatch(req: Request, url: URL, db: Stockon | null): Promise<CustomResponse> {
    for (const match of this.matches) {
      if (url.pathname.startsWith(match.prefix)) {
        let auth = await match.handler.auth(req);
        if (auth.isErr()) {
          return auth;
        }
        return match.handler.handle(req, {}, db);
      }
    }

    return this.errorResponse || notFound(`Route ${req.url} not supported.`);
  }

  private matchRoute(
    path: string,
    route: string,
  ): Record<string, string> | null {
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
