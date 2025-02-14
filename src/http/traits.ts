import type { CustomResponse } from "./response.ts";
import type Stockon from "../db/stockon.ts";

export interface RequestHandler {
  handle: (
    req: Request,
    params: Record<string, string>,
    mongo_db: Stockon | null,
  ) => Promise<CustomResponse>;
  auth: (req: Request) => Promise<CustomResponse>;
}
