import { Router } from "../http/router.ts";
import workOn from "../workspace/workon/requestHandler.ts";
import stockOn from "../workspace/stockon/requestHandler.ts";
import zoneHandler from "../workspace/zone/requestHandler.ts";
import { notFound } from "../http/responseTemplates.ts";
import { RequestType } from "../http/requestType.ts";
import {
  IsAuthenticatedHandler,
  SignInHandler,
  SignUpHandler,
} from "../auth/handler.ts";
import {Zone} from "./utils.ts";
import {HealthCheck} from "../healthCheck.ts";

const router = new Router(Zone.Root);

router
  // TODO: properly document usage
  .add(RequestType.POST, "/auth/signup", new SignUpHandler(), {
    description: "Helps to signup.",
  })
  .add(RequestType.POST, "/auth/signin", new SignInHandler(), {
    description: "Helps to signin.",
  })
  .add(RequestType.GET, "/auth/authenticated", new IsAuthenticatedHandler(), {
    description: "Checks if user is authenticated (token is valid).",
  })
    .add(RequestType.GET, "/health", new HealthCheck())
  .match("/workon", workOn.handle, {
    description: "Handles all requests for WorkOn",
    usage: "Route must start with /workon",
  })
  .match("/stockon", stockOn.handle)
  .match("/zones", zoneHandler.handle)
  .finish(notFound());

export default {
  handle: async (req: Request) => {
    return await router.handle(req);
  },
};
