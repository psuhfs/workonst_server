import type {CustomResponse} from "../../http/response.ts";
import type {RequestHandler} from "../../http/traits.ts";
import {success} from "../../http/responseTemplates.ts";
import {getZonesCache} from "../../cache/cache.ts";
import {StockOnCategories, Zone} from "../../handler/utils.ts";

export class GetZones implements RequestHandler {
    async handle(req: Request, _: Record<string, string>): Promise<CustomResponse> {
        const key = "zones";

        let cache = getZonesCache.get(key);
        if (cache !== undefined) {
            return success(cache, req.headers.get("Origin"));
        }
        let zones = Object.keys(Zone).filter((v) => v !== Zone.StockOn && v !== Zone.Root);
        getZonesCache.set(key, zones);
        return success(zones, req.headers.get("Origin"))
    }

    async auth(req: Request): Promise<CustomResponse> {
        // This route is open for all, no auth needed.
        return success({}, req.headers.get("Origin"));
    }

}

export class GetStockAccess implements RequestHandler {
    async handle(req: Request, _: Record<string, string>): Promise<CustomResponse> {
        const key = "stockon";
        let cache = getZonesCache.get(key);
        if (cache !== undefined) {
            return success(cache, req.headers.get("Origin"));
        }
        let zones = Object.keys(StockOnCategories);
        getZonesCache.set(key, zones);
        return success(zones, req.headers.get("Origin"))
    }

    async auth(req: Request): Promise<CustomResponse> {
        // This route is open for all, no auth needed.
        return success({}, req.headers.get("Origin"));
    }
}
