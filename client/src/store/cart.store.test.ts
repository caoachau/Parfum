import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../lib/api";
import { clearAccessToken, setAccessToken } from "../lib/token";
import { useAuth } from "./auth.store";
import { type CartItem, useCart } from "./cart.store";

function accessTokenValidForOneHour() {
  const encode = (value: object) =>
    btoa(JSON.stringify(value)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${encode({ alg: "none", typ: "JWT" })}.${encode({ exp: Math.floor(Date.now() / 1000) + 3600 })}.signature`;
}

const accountItem: CartItem = {
  variant: "account-variant",
  name: "Account perfume",
  price: 1_000_000,
  quantity: 1,
};

const guestItem: CartItem = {
  variant: "guest-variant",
  name: "Guest perfume",
  price: 500_000,
  stock: 10,
  quantity: 1,
};

function cartResponse(items: CartItem[]) {
  return {
    data: {
      data: {
        items,
        total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
        count: items.reduce((sum, item) => sum + item.quantity, 0),
      },
    },
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  clearAccessToken();
  useCart.setState({ items: [], total: 0, count: 0 });
  useAuth.setState({ user: null, isBootstrapped: true });
});

describe("cart session separation", () => {
  it("keeps account and guest carts separate, then merges the guest cart on the next login", async () => {
    const post = vi.spyOn(api, "post").mockImplementation(async (url) => {
      if (url === "/cart/items") return cartResponse([accountItem]) as any;
      if (url === "/cart/merge") return cartResponse([accountItem, guestItem]) as any;
      if (url === "/auth/logout") return { data: { message: "Logged out" } } as any;
      throw new Error(`Unexpected POST ${url}`);
    });
    vi.spyOn(api, "get").mockResolvedValue(cartResponse([accountItem, guestItem]) as any);

    setAccessToken(accessTokenValidForOneHour());
    useAuth.setState({
      user: { id: "user-1", name: "Buyer", email: "buyer@example.com", role: "customer" },
    });
    await useCart.getState().addItem(accountItem);

    expect(useCart.getState().items).toEqual([accountItem]);
    expect(localStorage.getItem("guest_cart")).toBeNull();

    useAuth.getState().logout();

    // Logout does not copy the MongoDB cart into guest_cart.
    expect(JSON.parse(localStorage.getItem("guest_cart") || "[]")).toEqual([]);

    await useCart.getState().addItem(guestItem);

    expect(useCart.getState().items).toMatchObject([guestItem]);
    expect(JSON.parse(localStorage.getItem("guest_cart") || "[]")).toMatchObject([guestItem]);

    setAccessToken(accessTokenValidForOneHour());
    await useCart.getState().syncOnLogin();

    expect(post).toHaveBeenCalledWith("/cart/merge", {
      items: [{ variant: guestItem.variant, quantity: 1 }],
    });
    expect(localStorage.getItem("guest_cart")).toBe("[]");
    expect(useCart.getState().items).toEqual([accountItem, guestItem]);
  });
});
