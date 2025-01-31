// requestType.test.ts

import { describe, expect, it } from "bun:test";
import { fromString, RequestType } from "../src/http/requestType.ts";

describe("RequestType Enum and fromString Function Tests", () => {
  it('should return RequestType.GET for "GET" string', () => {
    const result = fromString("GET");
    expect(result).toBe(RequestType.GET);
  });

  it('should return RequestType.POST for "POST" string', () => {
    const result = fromString("POST");
    expect(result).toBe(RequestType.POST);
  });

  it("should return undefined for unsupported string", () => {
    const result = fromString("DELETE");
    expect(result).toBeUndefined();
  });

  it("should return undefined for empty string", () => {
    const result = fromString("");
    expect(result).toBeUndefined();
  });

  it("should return undefined for unknown string", () => {
    const result = fromString("UNKNOWN");
    expect(result).toBeUndefined();
  });

  it("should return undefined for non-string input types", () => {
    const result = fromString("12345");
    expect(result).toBeUndefined();

    const resultNull = fromString(null as any);
    expect(resultNull).toBeUndefined();

    const resultUndefined = fromString(undefined as any);
    expect(resultUndefined).toBeUndefined();
  });
});
