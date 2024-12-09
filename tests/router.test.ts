// router.test.ts

import {describe, expect, it, mock} from "bun:test"; // Assuming Bun's test module
import {Router} from "../src/http/router";
import {RequestType} from "../src/http/requestType.ts";
import {CustomResponse} from "../src/http/response.ts";
import {TestWebhook} from "./test_helpers/webhook.test.ts";
import {notFound} from "../src/http/responseTemplates.ts";

describe('Router Tests', () => {
    let router: Router = new Router();
    router.add(RequestType.GET, "/", async () => new CustomResponse(new Response("Homepage")));
    router.add(RequestType.GET, "/about", async () => new CustomResponse(new Response("About us")));
    router.add(RequestType.POST, "/data", async (_) => new CustomResponse(new Response("Data received")));
    router.add(RequestType.GET, "/user/:id", async (_req, params) => new CustomResponse(new Response(`User ID: ${params.id}`)));


    it('should return 200 for known GET route "/"', async () => {
        const request = new Request("http://localhost/", {method: "GET"});
        const response = await router.handle(request);
        let testWebhook = new TestWebhook("");
        let resp = await response.intoResponse(testWebhook);

        expect(resp.status).toBe(200);
        expect(await resp.text()).toBe("Homepage");
    });

    it('should return 200 for known GET route "/about"', async () => {
        const request = new Request("http://localhost/about", {method: "GET"});
        const response = await router.handle(request);

        let testWebhook = new TestWebhook("");
        let resp = await response.intoResponse(testWebhook);

        expect(resp.status).toBe(200);
        expect(await resp.text()).toBe("About us");
    });

    it('should return 200 for known POST route "/data"', async () => {
        const request = new Request("http://localhost/data", {method: "POST"});
        const response = await router.handle(request);

        let testWebhook = new TestWebhook("");
        let resp = await response.intoResponse(testWebhook);

        expect(resp.status).toBe(200);
        expect(await resp.text()).toBe("Data received");
    });

    it('should return 404 for an unknown route', async () => {
        const request = new Request("http://localhost/unknown", {method: "GET"});
        const response = await router.handle(request);

        let testWebhook = new TestWebhook("{\"error\":\"Not Found\",\"message\":\"not found\"}");
        let resp = await response.intoResponse(testWebhook);

        expect(resp.status).toBe(404);
    });

    it('should handle dynamic routes and return the correct response', async () => {
        const request = new Request("http://localhost/user/123", {method: "GET"});
        const response = await router.handle(request);

        let testWebhook = new TestWebhook("");
        let resp = await response.intoResponse(testWebhook);

        expect(resp.status).toBe(200);
        expect(await resp.text()).toBe("User ID: 123");
    });

    it('should return 405 for unsupported methods', async () => {
        const request = new Request("http://localhost/", {method: "PATCH"});
        const response = await router.handle(request);

        let testWebhook = new TestWebhook("{\"error\":\"Bad Request\",\"message\":\"HTTP method: PATCH not supported.\",\"url\":\"http://localhost/\"}");
        let resp = await response.intoResponse(testWebhook);

        expect(resp.status).toBe(405);
    });

    describe("MatchRouter and handleMatch Functionality", () => {
        const matchRouter = new Router();

        matchRouter
            .match("/prefix", async () => new CustomResponse(new Response("Prefix matched")))
            .finish(notFound("Route not found"));

        it("should match a prefix route", async () => {
            const request = new Request("http://localhost/prefix/test", {method: "GET"});
            const response = await matchRouter.handle(request);

            let testWebhook = new TestWebhook("");
            let resp = await response.intoResponse(testWebhook);

            expect(resp.status).toBe(200);
            expect(await resp.text()).toBe("Prefix matched");
        });

        it("should return error response for unmatched route", async () => {
            const request = new Request("http://localhost/unknown", {method: "GET"});
            const response = await matchRouter.handle(request);

            let err = JSON.stringify({"error": "Not Found", "message": "Route not found"});

            let testWebhook = new TestWebhook(err);
            let resp = await response.intoResponse(testWebhook);

            expect(resp.status).toBe(404);
            expect(await resp.text()).toBe(err);
        });
    });

});
