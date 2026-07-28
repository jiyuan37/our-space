import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppShell } from "@/components/layout/app-shell";

describe("AppShell", () => {
  it("提供语义化主要内容和跳转链接", () => {
    render(
      <AppShell>
        <h1>Welcome Home</h1>
      </AppShell>,
    );

    expect(screen.getByRole("link", { name: "跳到主要内容" })).toHaveAttribute(
      "href",
      "#main-content",
    );
    expect(screen.getByRole("main")).toHaveTextContent("Welcome Home");
  });

  it("不会展示尚不可用的 Settings 入口", () => {
    render(<AppShell>内容</AppShell>);

    expect(
      screen.queryByRole("link", { name: "Settings" }),
    ).not.toBeInTheDocument();
  });
});
