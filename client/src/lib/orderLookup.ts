export type ClassifiedOrderLookup =
  { value: string; kind: "order" | "email" | "phone" } | { error: string };

export function classifyOrderLookupInput(rawValue: string): ClassifiedOrderLookup {
  const value = rawValue.trim();
  if (!value) return { error: "Vui lòng nhập mã đơn, email hoặc số điện thoại." };

  const orderCode = value.replace(/^#/, "");
  if (/^[a-f\d]{6}$/i.test(orderCode) || /^[a-f\d]{24}$/i.test(orderCode)) {
    return { value: orderCode, kind: "order" };
  }

  if (value.includes("@")) {
    const email = value.toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? { value: email, kind: "email" }
      : { error: "Email chưa đúng định dạng. Ví dụ: ban@example.com." };
  }

  if (/^[\d\s.+()-]+$/.test(value)) {
    let phone = value.replace(/\D/g, "");
    if (phone.startsWith("84") && phone.length === 11) phone = `0${phone.slice(2)}`;
    return /^0\d{9}$/.test(phone)
      ? { value: phone, kind: "phone" }
      : { error: "Số điện thoại Việt Nam phải gồm 10 chữ số và bắt đầu bằng 0." };
  }

  return { error: "Mã đơn phải gồm 6 hoặc 24 ký tự hexadecimal." };
}
