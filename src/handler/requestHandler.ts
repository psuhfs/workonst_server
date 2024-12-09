import {Router} from "../http/router.ts";
import workOn from "../workspace/workon/requestHandler.ts";
import {notFound} from "../http/responseTemplates.ts";

const router = new Router();

router
    .match("/workon", workOn.handle, {
        description: "Handles all requests for WorkOn",
        usage: "Route must start with /workon"
    })
    // .match("/stockon", stockOn.handle) // TODO: uncomment when we add impl for stockon
    .finish(notFound());

export default {
    handle: async (req: Request) => {
        return await router.handle(req);
    }
}

