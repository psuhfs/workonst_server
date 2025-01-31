import requestHandler from "./handler/requestHandler.ts";
import dotenv from "dotenv";
import { DiscordWebhook } from "./webhook/discord.ts";
import { startBackgroundTask } from "./report_gen/emailReport.ts";
import { DebugWebhook } from "./webhook/debug.ts";

dotenv.config();

let webhook = process.env.WEBHOOK
  ? new DiscordWebhook(process.env.WEBHOOK)
  : new DebugWebhook();

await startBackgroundTask(webhook);

const server = Bun.serve({
  port: 3000,
  async fetch(request): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*", // or specify your allowed origin, e.g., 'http://localhost:5000'
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400", // Cache preflight response for 1 day
        },
      });
    }
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
