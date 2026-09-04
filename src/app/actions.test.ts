import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  AuthenticationRequiredError,
  OwnerPermissionRequiredError,
  RateLimitExceededError,
} from "@/server/errors/domain-error";

const mocks = vi.hoisted(() => ({
  requireSession: vi.fn(),
  headers: vi.fn(),
  registerLimit: vi.fn(),
  invitationCreateLimit: vi.fn(),
  invitationAcceptLimit: vi.fn(),
  register: vi.fn(),
  spaceCreate: vi.fn(),
  invitationCreate: vi.fn(),
  invitationAccept: vi.fn(),
  invitationRevoke: vi.fn(),
  redirect: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/auth/session", () => ({
  requireSession: mocks.requireSession,
}));
vi.mock("@/server/rate-limit/default-limiter", () => ({
  rateLimiter: { consume: vi.fn() },
}));
vi.mock("@/server/rate-limit/rate-limiter", () => ({
  enforceRegistrationRateLimit: mocks.registerLimit,
  enforceInvitationCreateRateLimit: mocks.invitationCreateLimit,
  enforceInvitationAcceptRateLimit: mocks.invitationAcceptLimit,
}));
vi.mock("@/server/services/auth-service", () => ({
  AuthService: class {
    register = mocks.register;
  },
}));
vi.mock("@/server/services/space-service", () => ({
  SpaceService: class {
    create = mocks.spaceCreate;
  },
}));
vi.mock("@/server/services/invitation-service", () => ({
  InvitationService: class {
    create = mocks.invitationCreate;
    accept = mocks.invitationAccept;
    revoke = mocks.invitationRevoke;
  },
}));

import {
  acceptInvitationAction,
  createInvitationAction,
  createSpaceAction,
  registerAction,
  revokeInvitationAction,
} from "@/app/actions";

describe("Phase 2 Server Action wiring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireSession.mockResolvedValue({
      user: { userId: "user_1", email: "user@example.com", name: "Yuan" },
    });
    mocks.headers.mockResolvedValue({ get: () => null });
    mocks.invitationCreate.mockResolvedValue({
      id: "invitation_1",
      token: "safe_test_token",
    });
    mocks.spaceCreate.mockResolvedValue({});
    mocks.invitationAccept.mockResolvedValue({});
    mocks.invitationRevoke.mockResolvedValue(undefined);
    mocks.register.mockResolvedValue({});
  });

  it("register 保留安全 callback，并拒绝外部 redirect", async () => {
    const safeData = new FormData();
    safeData.set("name", "Yuan");
    safeData.set("email", "user@example.com");
    safeData.set("password", "a-safe-fake-password");
    safeData.set("callbackUrl", "/invite/safe_token");
    await registerAction({}, safeData);
    expect(mocks.registerLimit.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.register.mock.invocationCallOrder[0] ?? Infinity,
    );
    expect(mocks.redirect).toHaveBeenLastCalledWith(
      "/login?registered=1&callbackUrl=%2Finvite%2Fsafe_token",
    );

    const unsafeData = new FormData();
    unsafeData.set("name", "Yuan");
    unsafeData.set("email", "other@example.com");
    unsafeData.set("password", "a-safe-fake-password");
    unsafeData.set("callbackUrl", "https://evil.example");
    await registerAction({}, unsafeData);
    expect(mocks.redirect).toHaveBeenLastCalledWith(
      "/login?registered=1&callbackUrl=%2Fhome",
    );
  });

  it("create Space 不消耗 Invitation bucket", async () => {
    const data = new FormData();
    data.set("name", "Our Home");
    await createSpaceAction({}, data);
    expect(mocks.spaceCreate).toHaveBeenCalledOnce();
    expect(mocks.redirect).toHaveBeenCalledWith("/home?created=1");
    expect(mocks.invitationCreateLimit).not.toHaveBeenCalled();
    expect(mocks.invitationAcceptLimit).not.toHaveBeenCalled();
  });

  it("Invitation create 在 Service 前消耗 User bucket", async () => {
    const data = new FormData();
    data.set("email", "guest@example.com");
    await createInvitationAction({}, data);
    expect(mocks.invitationCreateLimit).toHaveBeenCalledWith(
      expect.anything(),
      "user_1",
    );
    expect(
      mocks.invitationCreateLimit.mock.invocationCallOrder[0],
    ).toBeLessThan(
      mocks.invitationCreate.mock.invocationCallOrder[0] ?? Infinity,
    );
    expect(mocks.invitationAcceptLimit).not.toHaveBeenCalled();
  });

  it("Invitation accept 在 Service 前消耗 IP bucket", async () => {
    const data = new FormData();
    data.set("token", "safe_test_token");
    await acceptInvitationAction({}, data);
    expect(mocks.redirect).toHaveBeenCalledWith("/home?joined=1");
    expect(mocks.invitationAcceptLimit).toHaveBeenCalledOnce();
    expect(
      mocks.invitationAcceptLimit.mock.invocationCallOrder[0],
    ).toBeLessThan(
      mocks.invitationAccept.mock.invocationCallOrder[0] ?? Infinity,
    );
  });

  it("Invitation 超限后不会调用 Service", async () => {
    mocks.invitationAcceptLimit.mockRejectedValueOnce(
      new RateLimitExceededError(),
    );
    const data = new FormData();
    data.set("token", "safe_test_token");
    await expect(acceptInvitationAction({}, data)).resolves.toEqual({
      errorCode: "RATE_LIMIT_EXCEEDED",
    });
    expect(mocks.invitationAccept).not.toHaveBeenCalled();
  });

  it("未认证 transport 在调用 Service 前被拒绝", async () => {
    mocks.requireSession.mockRejectedValueOnce(
      new AuthenticationRequiredError(),
    );
    const data = new FormData();
    data.set("name", "Our Home");
    await expect(createSpaceAction({}, data)).resolves.toEqual({
      errorCode: "AUTHENTICATION_REQUIRED",
    });
    expect(mocks.spaceCreate).not.toHaveBeenCalled();
  });

  it("revoke 将 typed authorization error 映射为平静结果", async () => {
    mocks.invitationRevoke.mockRejectedValueOnce(
      new OwnerPermissionRequiredError(),
    );
    const data = new FormData();
    data.set("invitationId", "invitation_1");
    await expect(revokeInvitationAction({}, data)).resolves.toEqual({
      errorCode: "OWNER_PERMISSION_REQUIRED",
    });
  });
});
