import {deSerializePointsDetails, generateEmailBody, type PointsDetails} from "./utils.ts";
import {sendEmail} from "./email.ts";
import {insertToDatabase} from "./mysql.ts";

export async function handleRequest(req: Request): Promise<Response> {
    if (req.method === 'POST') {
        return await handlePost(req);
    } else {
        return new Response("GET requests are not supported");
    }
}

async function handlePost(req: Request): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname == "/addpoint") {
        let body: PointsDetails = await req.json();
        console.log(body);
        console.log("sending email")
        await sendEmail({
            subject: "Shift Update Notification",
            to: body.email,
            text: generateEmailBody(body),
        });
        await insertToDatabase(body);

        return new Response("Email sent");
    }

    return new Response(`Invalid route ${url.pathname}`);
}
