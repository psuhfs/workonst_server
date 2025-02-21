import { internalServerError, success } from "../../http/responseTemplates.ts";
import type { CustomResponse } from "../../http/response.ts";
import type { RequestHandler } from "../../http/traits.ts";
import { handleAuth } from "../../auth/handler.ts";
import {getItemsCache} from "../../cache/cache.ts";

export class GetItems implements RequestHandler {
  async handle(req: Request): Promise<CustomResponse> {
    return this.handleGetItems(req);
  }

  async auth(req: Request): Promise<CustomResponse> {
    return handleAuth(req);
  }

  async handleGetItems(req: Request): Promise<CustomResponse> {
    try {
      let items: any | undefined = getItemsCache.get("items");
      if (items !== undefined) {
        console.log("Cache hit");
        return success(items, req.headers.get("Origin"));
      }
      console.log("Cache miss");
      const read = Bun.file("categories_schema.json");
      let json = await read.json();
        getItemsCache.set("items", json);
      return success(json, req.headers.get("Origin"));
    } catch (e) {
      return internalServerError(
        `An error occurred while trying to get items: ${e}`,
      );
    }
  }
}
