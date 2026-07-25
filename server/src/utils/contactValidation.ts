const disposableDomains = new Set([
  '10minutemail.com',
  'guerrillamail.com',
  'mailinator.com',
  'tempmail.com',
  'temp-mail.org',
  'yopmail.com',
]);

export function normalizeEmail(value: string) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

export function normalizePhone(value: string) {
  return String(value || '').replace(/\D/g, '');
}

export function isLikelyValidEmail(email: string) {
  const normalized = normalizeEmail(email);
  const domain = normalized.split('@')[1] || '';
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) && !disposableDomains.has(domain);
}

export function isLikelyValidVietnamPhone(phone: string) {
  const normalized = normalizePhone(phone);
  if (!/^0\d{9}$/.test(normalized)) return false;
  if (/^(\d)\1{9}$/.test(normalized)) return false;
  if (/^0(123456789|987654321)$/.test(normalized)) return false;
  if (/^0(000|111|222|333|444|555|666|777|888|999)/.test(normalized)) return false;
  return true;
}

export function assertValidContact(email: string, phone: string) {
  if (!isLikelyValidEmail(email)) {
    throw Object.assign(new Error('Email không hợp lệ hoặc không được chấp nhận'), { status: 400 });
  }
  if (!isLikelyValidVietnamPhone(phone)) {
    throw Object.assign(new Error('Số điện thoại không hợp lệ'), { status: 400 });
  }
}
