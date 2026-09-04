import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("@/app/actions", () => ({ registerAction: vi.fn() }));
import { RegisterForm } from "@/components/auth/register-form";

describe("RegisterForm", () => {
  afterEach(cleanup);
  it("提供关联 label 与密码边界", () => {
    render(<RegisterForm />);
    expect(screen.getByLabelText("你的名字")).toBeRequired();
    expect(screen.getByLabelText("邮箱")).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("密码（15–128 个字符）")).toHaveAttribute(
      "minLength",
      "15",
    );
  });

  it("只保留安全的站内 callback", () => {
    const { rerender } = render(
      <RegisterForm callbackUrl="/invite/safe_token" />,
    );
    expect(screen.getByDisplayValue("/invite/safe_token")).toHaveAttribute(
      "name",
      "callbackUrl",
    );
    rerender(<RegisterForm callbackUrl="//evil.example" />);
    expect(screen.getByDisplayValue("/home")).toHaveAttribute(
      "name",
      "callbackUrl",
    );
  });
});
