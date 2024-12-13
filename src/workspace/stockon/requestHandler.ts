import {Router} from "../../http/router.ts";
import {RequestType} from "../../http/requestType.ts";
import {handleGetItems} from "./getHandlers.ts";
import {handleSendEmail} from "./postHandlers.ts";

const router = new Router("/stockon");

router
    .add(RequestType.GET, "/getItems", handleGetItems, {
        description: "Populates the table with stock data based on params",
    })
    
    .add(RequestType.POST, "/sendMail", handleSendEmail, {
        description: "Sends email to logged in user and specified organization members",
    });

export default {
    handle: async (req: Request) => {
        return await router.handle(req);
    },
}