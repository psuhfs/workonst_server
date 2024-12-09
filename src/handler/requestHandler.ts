import {Router} from "../http/router.ts";
import workOn from "../workspace/workon/requestHandler.ts";
import {notFound} from "../http/responseTemplates.ts";
import {RequestType} from "../http/requestType.ts";
import {handleAuth, handleAuthSignin, handleAuthSignup} from "../auth/requestHandler.ts";

const router = new Router();

router
    // TODO: properly document usage
    .add(RequestType.POST, "/auth", handleAuth, {
        description: "Helps to maintain the session.",
    })
    .add(RequestType.POST, "/auth/signup", handleAuthSignup, {
        description: "Helps to signup.",
    })
    .add(RequestType.POST, "/auth/signin", handleAuthSignin, {
        description: "Helps to signin.",
    })
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

