import type { CustomResponse } from "./response.ts";
import type {Zone} from "../handler/utils.ts";

export interface RequestHandler {
  handle: (
    req: Request,
    params: Record<string, string>,
    zone: Zone,
  ) => Promise<CustomResponse>;
  auth: (req: Request, zone: Zone) => Promise<CustomResponse>;
}
