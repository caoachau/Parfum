import { describe, expect, it } from "vitest";
import { classifyOrderLookupInput } from "./orderLookup";

describe("order lookup input classification", () => {
  it("normalizes short order codes", () => {
    expect(classifyOrderLookupInput("#a1B2c3")).toEqual({ value: "a1B2c3", kind: "order" });
  });

  it("normalizes email and Vietnamese phone inputs", () => {
    expect(classifyOrderLookupInput(" Customer@Example.com ")).toEqual({
      value: "customer@example.com",
      kind: "email",
    });
    expect(classifyOrderLookupInput("+84 901 234 567")).toEqual({
      value: "0901234567",
      kind: "phone",
    });
  });

  it("returns a specific message for malformed input", () => {
    expect(classifyOrderLookupInput("customer@invalid")).toHaveProperty("error");
    expect(classifyOrderLookupInput("12345")).toHaveProperty("error");
    expect(classifyOrderLookupInput("not-an-order")).toHaveProperty("error");
  });
});
