export const CUSTOMER_SESSION_MS = 15 * 60 * 1000;
export const CUSTOMER_SESSION_WARNING_MS = 30 * 1000;
export const CUSTOMER_SESSION_STORAGE_KEY = "customer_session_timeout";

export type CustomerSessionTimeout = {
  expiresAt: number;
  warningExpiresAt: number | null;
};

export function readCustomerSession(): CustomerSessionTimeout | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(localStorage.getItem(CUSTOMER_SESSION_STORAGE_KEY) || "null");
    if (!parsed || !Number.isFinite(parsed.expiresAt)) return null;
    return {
      expiresAt: Number(parsed.expiresAt),
      warningExpiresAt: Number.isFinite(parsed.warningExpiresAt)
        ? Number(parsed.warningExpiresAt)
        : null,
    };
  } catch {
    return null;
  }
}

export function writeCustomerSession(value: CustomerSessionTimeout) {
  localStorage.setItem(CUSTOMER_SESSION_STORAGE_KEY, JSON.stringify(value));
  return value;
}

export function renewCustomerSession(now = Date.now()) {
  return writeCustomerSession({
    expiresAt: now + CUSTOMER_SESSION_MS,
    warningExpiresAt: null,
  });
}

export function beginCustomerSessionWarning(session: CustomerSessionTimeout, now = Date.now()) {
  if (session.warningExpiresAt) return session;
  return writeCustomerSession({
    ...session,
    warningExpiresAt: now + CUSTOMER_SESSION_WARNING_MS,
  });
}

export function clearCustomerSession() {
  if (typeof window !== "undefined") localStorage.removeItem(CUSTOMER_SESSION_STORAGE_KEY);
}
