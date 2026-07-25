// server/src/validators/auth.schema.ts
import { z } from "zod"
import { strongPasswordSchema } from "./password.schema"

export const registerSchema = z.object({
  name: z.string().min(2, "Tên tối thiểu 2 ký tự"),
  email: z.string().email("Email không hợp lệ"),
  phone: z.string().regex(/^0\d{9}$/, "Số điện thoại không hợp lệ"),
  password: strongPasswordSchema,
})

export const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
})
