import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const actionMock = vi.hoisted(() => vi.fn());
vi.mock("@/app/presence-actions", () => ({ updatePresenceAction: actionMock }));

import { HomeView } from "@/components/home/home-view";
import { I18nProvider } from "@/components/i18n/i18n-provider";
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
    window.history.replaceState({}, "", "/");
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
    const textarea = screen.getByLabelText("此刻的我");
    expect(textarea).toHaveAttribute("aria-describedby", "presence-hint");
    await userEvent.click(screen.getByRole("button", { name: "保存" }));
    const error = await screen.findByRole("alert");
    expect(error).toHaveAttribute("id", "presence-error");
    expect(error).toHaveTextContent("请把 Presence 保持在 120 个字符以内。");
    expect(textarea).toHaveAttribute(
      "aria-describedby",
      "presence-hint presence-error",
    );
    expect(textarea).toBeVisible();
  });

  it("以语义状态保存 announcement，并在 locale 切换后重新翻译保存与清除结果", async () => {
    actionMock
      .mockResolvedValueOnce({ status: "saved" })
      .mockResolvedValueOnce({ status: "cleared" });
    const home = homeWithPresence(new Date().toISOString());
    const view = render(
      <I18nProvider locale="zh-CN">
        <HomeView home={home} />
      </I18nProvider>,
    );

    await userEvent.click(
      await screen.findByRole("button", { name: "更新我的此刻" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "保存" }));
    expect(await screen.findByText("Presence 已保存。")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByLabelText("此刻的我")).not.toBeInTheDocument(),
    );

    view.rerender(
      <I18nProvider locale="en-US">
        <HomeView home={home} />
      </I18nProvider>,
    );
    expect(screen.getByText("Presence saved.")).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Update my Presence" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Let this be quiet for a while" }),
    );
    expect(
      await screen.findByText("Presence cleared. The space is quiet again."),
    ).toBeInTheDocument();

    view.rerender(
      <I18nProvider locale="zh-CN">
        <HomeView home={home} />
      </I18nProvider>,
    );
    expect(
      screen.getByText("Presence 已清除，空间回到安静。"),
    ).toBeInTheDocument();
  });

  it.each(["created", "joined"])(
    "%s 首次进入时展示 welcome，并把 URL 一次性清理为 /home",
    async (query) => {
      window.history.replaceState({}, "", `/home?${query}=1`);
      const home = homeWithPresence(new Date().toISOString());
      const view = render(
        <I18nProvider locale="zh-CN">
          <HomeView home={home} showWelcome />
        </I18nProvider>,
      );

      expect(
        screen.getByText("欢迎回家。这里已经属于你们两个人。"),
      ).toBeVisible();
      await waitFor(() => expect(window.location.pathname).toBe("/home"));
      expect(window.location.search).toBe("");

      window.history.replaceState({}, "", `/home?${query}=1`);
      view.rerender(
        <I18nProvider locale="en-US">
          <HomeView home={home} showWelcome />
        </I18nProvider>,
      );
      await waitFor(() => expect(window.location.search).toBe(""));
      await waitFor(() =>
        expect(
          screen.queryByText(
            "Welcome Home. This place now belongs to both of you.",
          ),
        ).not.toBeInTheDocument(),
      );
    },
  );

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
