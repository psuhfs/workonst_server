import {handleRequest} from "./requestHandler.ts"
import dotenv from "dotenv";
import {DiscordWebhook} from "./webhook/discord.ts";

dotenv.config()

let dcWebhook = process.env.WEBHOOK;
if (dcWebhook === undefined) {
    console.error("Discord webhook not set. Exiting...");
} else {
    let webhook = new DiscordWebhook(dcWebhook);

    const server = Bun.serve({
        port: 3000,
        async fetch(request): Promise<Response> {
            // Points email, (jisko mile h usko email), push all data to SQL
            // html me meal coupon violation
            // db edit
            // generate report every MON 8am
            return await handleRequest(request).then((c) => {
                return c.intoResponse(webhook);
            });
        },
    });

    console.log(`Listening on http://localhost:${server.port}`);
}

