import { describe, expect, it } from "vitest";
import {
  generateInvitationToken,
  hashInvitationToken,
} from "@/lib/auth/invitation-token";

describe("invitation token", () => {
  it("生成 URL-safe 原始 token 并只派生固定 hash", () => {
    const token = generateInvitationToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(hashInvitationToken(token)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashInvitationToken(token)).not.toBe(token);
  });
});
