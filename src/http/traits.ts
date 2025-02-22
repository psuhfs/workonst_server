import type { CustomResponse } from "./response.ts";
import type MongoDB from "../db/mongoDB.ts";

export interface RequestHandler {
  handle: (
    req: Request,
    params: Record<string, string>,
  ) => Promise<CustomResponse>;
  auth: (req: Request) => Promise<CustomResponse>;
}
