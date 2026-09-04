import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const signIn = vi.hoisted(() => vi.fn());
vi.mock("next-auth/react", () => ({ signIn }));
import { LoginForm } from "@/components/auth/login-form";

describe("LoginForm", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  it("具有可访问的凭据字段", () => {
    render(<LoginForm />);
    expect(screen.getByLabelText("邮箱")).toHaveAttribute(
      "autocomplete",
      "email",
    );
    expect(screen.getByLabelText("密码")).toHaveAttribute(
      "autocomplete",
      "current-password",
    );
  });

  it("将安全 callback 交给 NextAuth", async () => {
    signIn.mockResolvedValue({ ok: false, error: "CredentialsSignin" });
    render(<LoginForm callbackUrl="/invite/safe_token" />);
    await userEvent.type(screen.getByLabelText("邮箱"), "user@example.com");
    await userEvent.type(screen.getByLabelText("密码"), "wrong password");
    await userEvent.click(screen.getByRole("button", { name: "登录" }));
    expect(signIn).toHaveBeenCalledWith(
      "credentials",
      expect.objectContaining({ callbackUrl: "/invite/safe_token" }),
    );
  });

  it("拒绝外部 callback 并区分 rate limit", async () => {
    signIn.mockResolvedValue({ ok: false, error: "RATE_LIMIT_EXCEEDED" });
    render(<LoginForm callbackUrl="https://evil.example" />);
    await userEvent.type(screen.getByLabelText("邮箱"), "user@example.com");
    await userEvent.type(screen.getByLabelText("密码"), "wrong password");
    await userEvent.click(screen.getByRole("button", { name: "登录" }));
    expect(signIn).toHaveBeenCalledWith(
      "credentials",
      expect.objectContaining({ callbackUrl: "/home" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent("尝试有些频繁");
  });
});
