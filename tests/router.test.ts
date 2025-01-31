// router.test.ts

import { describe, expect, it, mock } from "bun:test"; // Assuming Bun's test module
import { Router } from "../src/http/router";
import { RequestType } from "../src/http/requestType.ts";
import { CustomResponse } from "../src/http/response.ts";
import { TestWebhook } from "./test_helpers/webhook.test.ts";
import { notFound, success } from "../src/http/responseTemplates.ts";
import type { RequestHandler } from "../src/http/traits.ts";

class TestResponse implements RequestHandler {
  private closure: any = null;

  public addClosure(
    foo: (req: Request, params: Record<string, string>) => CustomResponse,
  ): TestResponse {
    this.closure = foo;
    return this;
  }
  async handle(
    req: Request,
    params: Record<string, string>,
  ): Promise<CustomResponse> {
    if (this.closure == null) {
      return notFound();
    }
    return this.closure(req, params);
  }
  async auth(_req: Request): Promise<CustomResponse> {
    return success("TODO");
  }
}

describe("Router Tests", () => {
  let router: Router = new Router();
  router.add(
    RequestType.GET,
    "/",
    new TestResponse().addClosure((_a, _b) => success("Homepage")),
  );
  router.add(
    RequestType.GET,
    "/about",
    new TestResponse().addClosure((_a, _b) => success("About us")),
  );
  router.add(
    RequestType.POST,
    "/data",
    new TestResponse().addClosure((_a, _b) => success("Data received")),
  );
  router.add(
    RequestType.GET,
    "/user/:id",
    new TestResponse().addClosure((_a, params) =>
      success(`User ID: ${params.id}`),
    ),
  );

  it('should return 200 for known GET route "/"', async () => {
    const request = new Request("http://localhost/", { method: "GET" });
    const response = await router.handle(request);
    let testWebhook = new TestWebhook("");
    let resp = await response.intoResponse(testWebhook);

    expect(resp.status).toBe(200);
    expect(await resp.json()).toBe("Homepage");
  });

  it('should return 200 for known GET route "/about"', async () => {
    const request = new Request("http://localhost/about", { method: "GET" });
    const response = await router.handle(request);

    let testWebhook = new TestWebhook("");
    let resp = await response.intoResponse(testWebhook);

    expect(resp.status).toBe(200);
    expect(await resp.json()).toBe("About us");
  });

  it('should return 200 for known POST route "/data"', async () => {
    const request = new Request("http://localhost/data", { method: "POST" });
    const response = await router.handle(request);

    let testWebhook = new TestWebhook("");
    let resp = await response.intoResponse(testWebhook);

    expect(resp.status).toBe(200);
    expect(await resp.json()).toBe("Data received");
  });

  it("should return 404 for an unknown route", async () => {
    const request = new Request("http://localhost/unknown", { method: "GET" });
    const response = await router.handle(request);

    let testWebhook = new TestWebhook(
      '{"error":"Not Found","message":"Route http://localhost/unknown not supported."}',
    );
    let resp = await response.intoResponse(testWebhook);

    expect(resp.status).toBe(404);
  });

  it("should handle dynamic routes and return the correct response", async () => {
    const request = new Request("http://localhost/user/123", { method: "GET" });
    const response = await router.handle(request);

    let testWebhook = new TestWebhook("");
    let resp = await response.intoResponse(testWebhook);

    expect(resp.status).toBe(200);
    expect(await resp.json()).toBe("User ID: 123");
  });

  it("should return 405 for unsupported methods", async () => {
    const request = new Request("http://localhost/", { method: "PATCH" });
    const response = await router.handle(request);

    let testWebhook = new TestWebhook(
      '{"error":"Bad Request","message":"HTTP method: PATCH not supported.","url":"http://localhost/"}',
    );
    let resp = await response.intoResponse(testWebhook);

    expect(resp.status).toBe(405);
  });

  describe("MatchRouter and handleMatch Functionality", () => {
    const matchRouter = new Router();

    matchRouter
      .match(
        "/prefix",
        async () => new CustomResponse(new Response("Prefix matched")),
      )
      .finish(notFound("Route not found"));

    it("should match a prefix route", async () => {
      const request = new Request("http://localhost/prefix/test", {
        method: "GET",
      });
      const response = await matchRouter.handle(request);

      let testWebhook = new TestWebhook(
        '{"error":"Method Not Allowed","message":"Method GET not allowed"}',
      );
      let resp = await response.intoResponse(testWebhook);

      expect(resp.status).toBe(405);
    });

    it("should return error response for unmatched route", async () => {
      const request = new Request("http://localhost/unknown", {
        method: "GET",
      });
      const response = await matchRouter.handle(request);

      let err = JSON.stringify({
        error: "Method Not Allowed",
        message: "Method GET not allowed",
      });

      let testWebhook = new TestWebhook(err);
      let resp = await response.intoResponse(testWebhook);

      expect(resp.status).toBe(405);
      expect(await resp.text()).toBe(err);
    });
  });
});
