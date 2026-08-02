import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  beginCustomerSessionWarning,
  clearCustomerSession,
  CUSTOMER_SESSION_MS,
  CUSTOMER_SESSION_STORAGE_KEY,
  CUSTOMER_SESSION_WARNING_MS,
  readCustomerSession,
  renewCustomerSession,
} from "./customerSession";

describe("customer session timeout", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("starts a customer session lasting 15 minutes", () => {
    const session = renewCustomerSession(1_000);

    expect(session).toEqual({
      expiresAt: 1_000 + CUSTOMER_SESSION_MS,
      warningExpiresAt: null,
    });
    expect(readCustomerSession()).toEqual(session);
  });

  it("opens a 30-second warning without extending the original session", () => {
    const session = renewCustomerSession(1_000);
    const warning = beginCustomerSessionWarning(session, 5_000);

    expect(warning.expiresAt).toBe(session.expiresAt);
    expect(warning.warningExpiresAt).toBe(5_000 + CUSTOMER_SESSION_WARNING_MS);
  });

  it("clears the persisted timeout on logout", () => {
    renewCustomerSession(1_000);
    clearCustomerSession();

    expect(localStorage.getItem(CUSTOMER_SESSION_STORAGE_KEY)).toBeNull();
    expect(readCustomerSession()).toBeNull();
  });
});
