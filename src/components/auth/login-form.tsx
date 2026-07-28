"use client";

import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  FormField,
  Notice,
  PrimaryButton,
} from "@/components/ui/form-controls";

export function LoginForm() {
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <form
      className="calm-form"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const result = await signIn("credentials", {
          email: data.get("email"),
          password: data.get("password"),
          redirect: false,
        });
        if (result?.ok) window.location.href = "/space";
        else setError("邮箱或密码不正确，请慢慢再试一次。");
      }}
    >
      <FormField
        label="邮箱"
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
      />
      <FormField
        label="密码"
        id="password"
        name="password"
        type="password"
        required
        autoComplete="current-password"
      />
      {error && <Notice tone="error">{error}</Notice>}
      <PrimaryButton pending={!ready}>
        {ready ? "登录" : "正在准备…"}
      </PrimaryButton>
    </form>
  );
}
