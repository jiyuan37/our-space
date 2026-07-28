import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
vi.mock("@/app/actions", () => ({ registerAction: vi.fn() }));
import { RegisterForm } from "@/components/auth/register-form";

describe("RegisterForm", () => {
  it("提供关联 label 与密码边界", () => {
    render(<RegisterForm />);
    expect(screen.getByLabelText("你的名字")).toBeRequired();
    expect(screen.getByLabelText("邮箱")).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("密码（15–128 个字符）")).toHaveAttribute(
      "minLength",
      "15",
    );
  });
});
