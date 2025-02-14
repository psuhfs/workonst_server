import { Router } from "../../http/router.ts";
import { RequestType } from "../../http/requestType.ts";
import { StockEmailSender } from "./postHandlers.ts";
import { GetItems } from "./getHandlers.ts";
import type Stockon from "../../db/stockon.ts";

const router = new Router("/stockon");

router
  .add(RequestType.GET, "/getItems", new GetItems(), {
    description: "Populates the table with stock data based on params",
  })

  .add(RequestType.POST, "/addItems", new StockEmailSender(), {
    description:
      "Sends email to logged in user and specified organization members",
  });

export default {
  handle: async (req: Request, db: Stockon) => {
    return await router.handle(req, db);
  },
};
