import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  AuthenticationRequiredError,
  PresenceTextInvalidError,
} from "@/server/errors/domain-error";

const mocks = vi.hoisted(() => ({
  requireSession: vi.fn(),
  updateOwn: vi.fn(),
  clearOwn: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/auth/session", () => ({
  requireSession: mocks.requireSession,
}));
vi.mock("@/server/services/presence-service", () => ({
  PresenceService: class {
    updateOwn = mocks.updateOwn;
    clearOwn = mocks.clearOwn;
  },
}));

import { updatePresenceAction } from "@/app/presence-actions";

describe("Presence Server Action wiring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireSession.mockResolvedValue({ user: { userId: "viewer-user" } });
    mocks.updateOwn.mockResolvedValue({ id: "presence-1" });
    mocks.clearOwn.mockResolvedValue({ cleared: true });
  });

  it("只把 session user 与 shortText 交给 Service，忽略伪造 residentId", async () => {
    const data = new FormData();
    data.set("shortText", "  今天很平静  ");
    data.set("residentId", "partner-resident");
    await expect(updatePresenceAction({}, data)).resolves.toEqual({
      status: "saved",
    });
    expect(mocks.updateOwn).toHaveBeenCalledWith(
      "viewer-user",
      "  今天很平静  ",
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/home");
  });

  it("明确 clear intent 只清除自己的 Presence", async () => {
    const data = new FormData();
    data.set("intent", "clear");
    await expect(updatePresenceAction({}, data)).resolves.toEqual({
      status: "cleared",
    });
    expect(mocks.clearOwn).toHaveBeenCalledWith("viewer-user");
    expect(mocks.updateOwn).not.toHaveBeenCalled();
  });

  it("以稳定 code 返回认证和 validation 错误", async () => {
    mocks.requireSession.mockRejectedValueOnce(
      new AuthenticationRequiredError(),
    );
    await expect(updatePresenceAction({}, new FormData())).resolves.toEqual({
      errorCode: "AUTHENTICATION_REQUIRED",
    });

    mocks.updateOwn.mockRejectedValueOnce(new PresenceTextInvalidError());
    const data = new FormData();
    data.set("shortText", "x".repeat(121));
    await expect(updatePresenceAction({}, data)).resolves.toEqual({
      errorCode: "PRESENCE_TEXT_INVALID",
    });
  });
});
