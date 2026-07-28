import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
vi.mock("next-auth/react", () => ({ signIn: vi.fn() }));
import { LoginForm } from "@/components/auth/login-form";

describe("LoginForm", () => {
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
});
