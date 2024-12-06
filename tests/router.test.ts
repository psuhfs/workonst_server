// router.test.ts

import {describe, expect, it, mock} from "bun:test"; // Assuming Bun's test module
import {Router} from "../src/http/router";
import {RequestType} from "../src/http/requestType.ts";
import {CustomResponse} from "../src/http/response.ts";

describe('Router Tests', () => {
    let router: Router = new Router();
    router.add(RequestType.GET, "/", async () => new CustomResponse(new Response("Homepage")));
    router.add(RequestType.GET, "/about", async () => new CustomResponse(new Response("About us")));
    router.add(RequestType.POST, "/data", async (_) => new CustomResponse(new Response("Data received")));
    router.add(RequestType.GET, "/user/:id", async (_req, params) => new CustomResponse(new Response(`User ID: ${params.id}`)));


    it('should return 200 for known GET route "/"', async () => {
        const request = new Request("http://localhost/", {method: "GET"});
        const response = await router.handle(request);
        expect(response.getResponse().status).toBe(200);
        expect(await response.getResponse().text()).toBe("Homepage");
    });

    it('should return 200 for known GET route "/about"', async () => {
        const request = new Request("http://localhost/about", {method: "GET"});
        const response = await router.handle(request);
        expect(response.getResponse().status).toBe(200);
        expect(await response.getResponse().text()).toBe("About us");
    });

    it('should return 200 for known POST route "/data"', async () => {
        const request = new Request("http://localhost/data", {method: "POST"});
        const response = await router.handle(request);
        expect(response.getResponse().status).toBe(200);
        expect(await response.getResponse().text()).toBe("Data received");
    });

    it('should return 404 for an unknown route', async () => {
        const request = new Request("http://localhost/unknown", {method: "GET"});
        const response = await router.handle(request);
        expect(response.getResponse().status).toBe(404);
    });

    it('should handle dynamic routes and return the correct response', async () => {
        const request = new Request("http://localhost/user/123", {method: "GET"});
        const response = await router.handle(request);
        expect(response.getResponse().status).toBe(200);
        expect(await response.getResponse().text()).toBe("User ID: 123");
    });

    it('should return 405 for unsupported methods', async () => {
        const request = new Request("http://localhost/", {method: "PATCH"});
        const response = await router.handle(request);
        expect(response.getResponse().status).toBe(405);
    });
});
