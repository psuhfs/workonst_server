import { Router } from "../../http/router.ts";
import { RequestType } from "../../http/requestType.ts";
import { StockEmailSender } from "./postHandlers.ts";
import { GetItems } from "./getHandlers.ts";
import type MongoDB from "../../db/mongoDB.ts";

const router = new Router("/stockon");

router
  .add(RequestType.GET, "/getItems", new GetItems(), {
    description: "Populates the table with stock data based on params",
  })

  .add(RequestType.POST, "/addItems", new StockEmailSender(), {
    description:
      "Sends email to logged in user and specified organization members",
  }).add(RequestType.POST, "/editItems", new StockEmailSender(), {
    description:
      "Sends email to logged in user and specified organization members",
  });

export default {
  handle: async (req: Request) => {
    return await router.handle(req);
  },
};
