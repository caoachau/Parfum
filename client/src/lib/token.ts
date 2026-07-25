// Luu access token TRONG BO NHO (khong localStorage) -> giam rui ro bi danh cap qua XSS.
// Access token song ngan (15 phut). Khi reload trang, token bi mat va se duoc lay lai
// bang "silent refresh" nho refresh token nam trong httpOnly cookie.
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function clearAccessToken(): void {
  accessToken = null;
}

// Doc CSRF token tu cookie (khong httpOnly) de gui lai qua header X-CSRF-Token (double-submit).
export function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)csrfToken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}
