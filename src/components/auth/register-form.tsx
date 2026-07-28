"use client";

import { useActionState } from "react";

import { registerAction } from "@/app/actions";
import {
  FormField,
  Notice,
  PrimaryButton,
} from "@/components/ui/form-controls";

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, {});
  return (
    <form action={action} className="calm-form">
      <FormField
        label="你的名字"
        id="name"
        name="name"
        required
        maxLength={80}
      />
      <FormField
        label="邮箱"
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
      />
      <FormField
        label="密码（15–128 个字符）"
        id="password"
        name="password"
        type="password"
        minLength={15}
        maxLength={128}
        required
        autoComplete="new-password"
        hint="可以使用一段容易记住、足够长的短语。"
      />
      {state.error && <Notice tone="error">{state.error}</Notice>}
      <PrimaryButton pending={pending}>
        {pending ? "正在准备…" : "创建账户"}
      </PrimaryButton>
    </form>
  );
}
