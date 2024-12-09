console.log(JSON.stringify({
    id: 1,
    accessCode: "abg6200",
    employeeName: "Sandipsinh Rathod",
    employeeId: 979678680,
    shiftDate: "2024-11-22T00:00:00.000Z",
    selectedShift: "9am - 1pm (Analyst)",
    manualShift: "",
    reason: "Tardy",
    comments: "test",
    email: "sdr5549@psu.edu",
    points: 1,
}))

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
    await startBackgroundTask(webhook);

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

