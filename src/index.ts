import requestHandler from "./handler/requestHandler.ts"
import dotenv from "dotenv";
import {DiscordWebhook} from "./webhook/discord.ts";
import {startBackgroundTask} from "./report_gen/emailReport.ts";

dotenv.config()

let dcWebhook = process.env.WEBHOOK;
if (dcWebhook === undefined) {
    console.error("Discord webhook not set. Exiting...");
} else {
    let webhook = new DiscordWebhook(dcWebhook);
    startBackgroundTask(webhook);

    const server = Bun.serve({
        port: 3000,
        async fetch(request): Promise<Response> {
            // done: Points email, (jisko mile h usko email), push all data to SQL
            // html me meal coupon violation
            // db edit
            // done: generate report every MON 8am
            return await requestHandler.handle(request).then((resp) => {
                if (resp.isErr()) {
                    console.debug(resp.error());
                }
                return resp.intoResponse(webhook);
            });
        },
    });

    console.log(`Listening on http://localhost:${server.port}`);
}

