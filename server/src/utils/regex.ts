// Escape các ký tự đặc biệt của RegExp để tránh Regex/ReDoS injection
// khi ghép chuỗi người dùng vào { $regex } của MongoDB.
export function escapeRegex(input: string): string {
  return String(input).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
