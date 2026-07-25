import { describe, it, expect, beforeEach } from "vitest";
import { getAccessToken, setAccessToken, clearAccessToken, getCsrfToken } from "./token";

describe("token store (in-memory)", () => {
  beforeEach(() => clearAccessToken());

  it("luu va doc access token trong bo nho", () => {
    expect(getAccessToken()).toBeNull();
    setAccessToken("abc.def.ghi");
    expect(getAccessToken()).toBe("abc.def.ghi");
  });

  it("xoa access token", () => {
    setAccessToken("xyz");
    clearAccessToken();
    expect(getAccessToken()).toBeNull();
  });

  it("doc csrf token tu cookie", () => {
    document.cookie = "csrfToken=token123";
    expect(getCsrfToken()).toBe("token123");
  });
});
