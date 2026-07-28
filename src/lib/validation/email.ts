import { z } from "zod";

export const emailSchema = z
  .string()
  .transform((value) => value.trim().toLowerCase())
  .pipe(z.string().email("请输入有效的邮箱地址。"));

export function normalizeEmail(value: string): string {
  return emailSchema.parse(value);
}
