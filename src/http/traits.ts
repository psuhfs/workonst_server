import type { CustomResponse } from "./response.ts";

export interface RequestHandler {
  handle: (
    req: Request,
    params: Record<string, string>,
  ) => Promise<CustomResponse>;
  auth: (req: Request) => Promise<CustomResponse>;
}
