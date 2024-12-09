import { describe, expect, it, beforeEach } from "bun:test";
import {prisma} from "../src/handler/db.ts";
import jwt from "jsonwebtoken";
import {handleAuth, handleAuthSignin, handleAuthSignup} from "../src/auth/requestHandler.ts";
import {internalServerError, success, unauthorized} from "../src/http/responseTemplates.ts";
import {TestWebhook} from "./test_helpers/webhook.test.ts";

console.log(await prisma.crew_leaders.findMany())

describe("Auth function tests", () => {

    describe("handleAuth", () => {
        it("should return success if token is valid", async () => {
            // First, create a valid JWT token using real jwt.sign
            const payload = { username: "test_user", password: "hashed_password" };
            const token = jwt.sign(payload, process.env.JWT as string, { expiresIn: '10h' });

            const mockRequest = {
                json: () => Promise.resolve({ token }),
            } as unknown as Request;

            const response = await handleAuth(mockRequest);
            expect(response).toEqual(success({ message: "Auth Successful." }));
        });

        it("should return unauthorized if token is invalid", async () => {
            const invalidToken = "invalid_token";

            const mockRequest = {
                json: () => Promise.resolve({ token: invalidToken }),
            } as unknown as Request;

            const response = await handleAuth(mockRequest);
            let x = await response.intoResponse(new TestWebhook("{\"error\":\"Unauthorized\",\"message\":\"Unauthorized access\"}"));
            expect(x.status).toEqual(401);
        });
    });

    describe("handleAuthSignin", () => {
        it("should return unauthorized if credentials are incorrect", async () => {
            const body = { username: "wronguser", password: "wrongpassword" };

            const mockRequest = {
                json: () => Promise.resolve(body),
            } as unknown as Request;

            const response = await handleAuthSignin(mockRequest);
            expect(response).toEqual(unauthorized("Invalid username or password."));
        });

        it("should handle errors gracefully", async () => {
            const mockRequest = {
                json: () => { throw new Error("Parse error"); },
            } as unknown as Request;

            const response = await handleAuthSignin(mockRequest);
            expect(response).toEqual(internalServerError("Unable to process auth signin request.", "Error: Parse error"));
        });
    });

    describe("handleAuthSignup", () => {

        it("should return unauthorized if signup details are missing", async () => {
            const body = { username: "newuser", password: "password123" };

            const mockRequest = {
                json: () => Promise.resolve(body),
            } as unknown as Request;

            const response = await handleAuthSignup(mockRequest);
            expect(response).toEqual(unauthorized("No signup details provided."));
        });

        it("should handle errors gracefully", async () => {
            const mockRequest = {
                json: () => { throw new Error("Parse error"); },
            } as unknown as Request;

            const response = await handleAuthSignup(mockRequest);
            expect(response).toEqual(internalServerError("Unable to process auth signup request.", "Error: Parse error"));
        });
    });
});
