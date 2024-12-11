import {Router} from "../../http/router.ts";
import {RequestType} from "../../http/requestType.ts";
import {handlePopulateTable} from "./getHandlers.ts";
import {handleSendEmail} from "./postHandlers.ts";

const router = new Router("/stockon");

router
    .add(RequestType.GET, "/populatetable", handlePopulateTable, {
        description: "Populates the table with stock data based on params",
    })
    
    .add(RequestType.POST, "/sendmail", handleSendEmail, {
        description: "Sends email to logged in user and store in database",
    });

export default {
    handle: async (req: Request) => {
        return await router.handle(req);
    },
}