import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AvatarWizard } from "./avatar-wizard";
import { avatarAction } from "@/app/avatar-actions";
import { AVATAR, type AvatarJobView } from "@/lib/avatar/config";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/app/avatar-actions", () => ({ avatarAction: vi.fn() }));
vi.mock("@/components/i18n/i18n-provider", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});
const job: AvatarJobView = {
  id: "e67b7b9d-cee8-4bc2-9ea9-0bc614eea9c8",
  status: "READY",
  candidateUrl: "/api/avatar/assets/test",
  expiresAt: new Date(Date.now() + AVATAR.candidateTtlMs).toISOString(),
};
describe("头像交互的网络恢复", () => {
  it("连续 PENDING 读取不会无限延长等待，也不会重发生成", async () => {
    vi.useFakeTimers();
    const pending = { ...job, status: "PENDING" as const, candidateUrl: null };
    const fetcher = vi.fn().mockImplementation(async () => ({
      ok: true,
      json: async () => pending,
    }));
    vi.stubGlobal("fetch", fetcher);
    render(<AvatarWizard currentUrl={null} initialJob={pending} enabled />);
    for (let i = 0; i < AVATAR.pendingTtlMs / 2000 + 2; i++)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });
    expect(screen.getByText("errors.AVATAR_GENERATION_FAILED")).toBeVisible();
    expect(
      fetcher.mock.calls.every(([url]) => url === `/api/avatar/jobs/${job.id}`),
    ).toBe(true);
    expect(fetcher.mock.calls.length).toBeLessThanOrEqual(
      AVATAR.pendingTtlMs / 2000,
    );
  });
  it("确认断网后保留候选并允许再次明确确认", async () => {
    vi.mocked(avatarAction).mockRejectedValue(
      new Error("controlled connection failure"),
    );
    render(<AvatarWizard currentUrl={null} initialJob={job} enabled />);
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "avatar.confirm" }));
    await waitFor(() =>
      expect(screen.getByText("errors.UNEXPECTED_ERROR")).toBeVisible(),
    );
    expect(
      screen.getByRole("button", { name: "avatar.confirm" }),
    ).toBeEnabled();
    expect(screen.getByAltText("avatar.candidateAlt")).toBeVisible();
    expect(avatarAction).toHaveBeenCalledExactlyOnceWith("confirm", job.id);
  });
  it("取消断网后不假称删除成功并允许重试", async () => {
    vi.mocked(avatarAction).mockRejectedValue(
      new Error("controlled connection failure"),
    );
    render(<AvatarWizard currentUrl={null} initialJob={job} enabled />);
    fireEvent.click(screen.getByRole("button", { name: "avatar.cancel" }));
    await waitFor(() =>
      expect(screen.getByText("errors.UNEXPECTED_ERROR")).toBeVisible(),
    );
    expect(screen.getByRole("button", { name: "avatar.cancel" })).toBeEnabled();
    expect(screen.getByAltText("avatar.candidateAlt")).toBeVisible();
  });
});
