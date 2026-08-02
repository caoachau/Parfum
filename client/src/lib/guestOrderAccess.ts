const keyFor = (orderId: string) => `guest-order-token:${orderId}`;

export function saveGuestOrderToken(orderId: string, token?: string) {
  if (orderId && token) sessionStorage.setItem(keyFor(orderId), token);
}

export function guestOrderHeaders(orderId?: string) {
  const token = orderId ? sessionStorage.getItem(keyFor(orderId)) : null;
  return token ? { "X-Guest-Order-Token": token } : undefined;
}

export function clearGuestOrderToken(orderId: string) {
  sessionStorage.removeItem(keyFor(orderId));
}
