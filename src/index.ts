import requestHandler from "./handler/requestHandler.ts";
import dotenv from "dotenv";
import {DiscordWebhook} from "./webhook/discord.ts";
import {startBackgroundTask} from "./report_gen/emailReport.ts";
import {DebugWebhook} from "./webhook/debug.ts";
import Stockon from "./db/stockon.ts";
import {validate} from "./init_validator.ts";

dotenv.config();
validate();

let webhook = process.env.WEBHOOK
    ? new DiscordWebhook(process.env.WEBHOOK)
    : new DebugWebhook();

await startBackgroundTask(webhook);

const server = Bun.serve({
    port: process.env.PORT,
    async fetch(request): Promise<Response> {
        if (request.method === "OPTIONS") {
            return new Response(null, {
                headers: {
                    "Access-Control-Allow-Origin": `${request.headers.get("Origin")}`, // or specify your allowed origin, e.g., 'http://localhost:5000'
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie",
                    "Access-Control-Max-Age": "86400", // Cache preflight response for 1 day
                    "Access-Control-Allow-Credentials": "true",
                },
            });
        }
        // done: Points email, (jisko mile h usko email), push all data to SQL
        // html me meal coupon violation
        // db edit
        // done: generate report every MON 8am
        return await requestHandler.handle(request).then(async (resp) => {
            if (resp.isErr()) {
                console.debug(resp.error());
            }
            let finalResponse = await resp.intoResponse(webhook);
            let origin = request.headers.get("Origin");
            if (origin) {
                finalResponse.headers.set("Access-Control-Allow-Origin", origin);
            }
            return finalResponse;
        });
    },
});

console.log(`Listening on http://localhost:${server.port}`);
