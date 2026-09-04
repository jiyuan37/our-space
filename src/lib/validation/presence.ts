import { PresenceTextInvalidError } from "@/server/errors/domain-error";

export const PRESENCE_MAX_LENGTH = 120;

export function normalizePresenceText(value: unknown): string | null {
  if (typeof value !== "string") throw new PresenceTextInvalidError();
  const text = value.trim();
  if (!text) return null;
  if (Array.from(text).length > PRESENCE_MAX_LENGTH) {
    throw new PresenceTextInvalidError();
  }
  return text;
}
