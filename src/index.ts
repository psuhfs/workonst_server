import {handleRequest} from "./requestHandler.ts"
import dotenv from "dotenv";
import {logError} from "./logger.ts";

dotenv.config()

const server = Bun.serve({
    port: 3000,
    async fetch(request) {
        // Points email, (jisko mile h usko email), push all data to SQL
        // html me meal coupon violation
        // db edit
        // generate report every MON 8am
        let response = await handleRequest(request);
        if (response instanceof Error) {
            let err = JSON.stringify({error: response.message || "An unknown error occurred"});
            await logError(err);

            return new Response(
                err,
                {status: 500, headers: {"Content-Type": "application/json"}}
            );
        } else {
            return response;
        }
    },
});

console.log(`Listening on http://localhost:${server.port}`);
