import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const actionMock = vi.hoisted(() => vi.fn());
vi.mock("@/app/presence-actions", () => ({ updatePresenceAction: actionMock }));

import { HomeView } from "@/components/home/home-view";
import type { HomeViewModel } from "@/server/services/home-service";

function homeWithPresence(updatedAt: string): HomeViewModel {
  return {
    space: { id: "space-1", name: "我们的小屋" },
    residents: [
      {
        id: "owner-resident",
        displayName: "阿禾",
        avatarUrl: null,
        isViewer: true,
        presence: { shortText: "在窗边看书", updatedAt },
      },
      {
        id: "partner-resident",
        displayName: "小满",
        avatarUrl: null,
        isViewer: false,
        presence: { shortText: "正在慢慢回家", updatedAt },
      },
    ],
  };
}

describe("HomeView", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("展示 Space 与两位真实 Resident，并只给查看者编辑入口", async () => {
    render(<HomeView home={homeWithPresence(new Date().toISOString())} />);
    expect(screen.getByRole("heading", { name: "我们的小屋" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "小满" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "阿禾" })).toBeVisible();
    await waitFor(() => expect(screen.getByText("正在慢慢回家")).toBeVisible());
    expect(
      screen.queryByText(/小时前|昨天|ago|last seen/i),
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "更新我的此刻" }),
    ).toHaveLength(1);
  });

  it("本地日历日过期后不闪现旧文案，并自然回到 Quiet State", async () => {
    const old = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    render(<HomeView home={homeWithPresence(old)} />);
    expect(screen.queryByText("正在慢慢回家")).not.toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText("今天这里很安静。")).toBeVisible(),
    );
    expect(screen.queryByText("在窗边看书")).not.toBeInTheDocument();
  });

  it("以内联编辑器编辑自己的 Presence", async () => {
    render(<HomeView home={homeWithPresence(new Date().toISOString())} />);
    await userEvent.click(
      await screen.findByRole("button", { name: "更新我的此刻" }),
    );
    expect(screen.getByLabelText("此刻的我")).toHaveValue("在窗边看书");
    expect(screen.getByRole("button", { name: "保存" })).toBeVisible();
    expect(screen.getByRole("button", { name: "取消" })).toBeVisible();
  });

  it("保存失败时保留原位置并展示本地化错误", async () => {
    actionMock.mockResolvedValue({ errorCode: "PRESENCE_TEXT_INVALID" });
    render(<HomeView home={homeWithPresence(new Date().toISOString())} />);
    await userEvent.click(
      await screen.findByRole("button", { name: "更新我的此刻" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "保存" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "请把 Presence 保持在 120 个字符以内。",
    );
    expect(screen.getByLabelText("此刻的我")).toBeVisible();
  });

  it("保存等待期间禁用操作并给出克制的 pending 文案", async () => {
    let finish!: (value: { errorCode: "UNEXPECTED_ERROR" }) => void;
    actionMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    render(<HomeView home={homeWithPresence(new Date().toISOString())} />);
    await userEvent.click(
      await screen.findByRole("button", { name: "更新我的此刻" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "保存" }));
    expect(screen.getByRole("button", { name: "正在保存…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "取消" })).toBeDisabled();
    await act(async () => finish({ errorCode: "UNEXPECTED_ERROR" }));
  });
});
