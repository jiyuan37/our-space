import argon2 from "argon2";

import { PasswordPolicyError } from "@/server/errors/domain-error";

export const PASSWORD_MIN_LENGTH = 15;
export const PASSWORD_MAX_LENGTH = 128;
export const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
  hashLength: 32,
} as const;

export function validatePassword(password: string): void {
  const length = Array.from(password).length;
  if (length < PASSWORD_MIN_LENGTH || length > PASSWORD_MAX_LENGTH) {
    throw new PasswordPolicyError();
  }
}

export async function hashPassword(password: string): Promise<string> {
  validatePassword(password);
  return argon2.hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(
  hash: string,
  password: string,
): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}
