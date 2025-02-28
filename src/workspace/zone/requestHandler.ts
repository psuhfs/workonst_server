import { Router } from "../../http/router.ts";
import { RequestType } from "../../http/requestType.ts";
import {Zone} from "../../handler/utils.ts";
import {GetZones} from "./getHandlers.ts";

const router = new Router(Zone.Root, "/zones");

router
  .add(RequestType.GET, "/getZones", new GetZones(), {
    description: "Returns all available Zones (varients) in utils/Zone",
  });

export default {
  handle: async (req: Request) => {
    return await router.handle(req);
  },
};
