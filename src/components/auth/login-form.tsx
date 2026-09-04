"use client";

import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  FormField,
  Notice,
  PrimaryButton,
} from "@/components/ui/form-controls";
import {
  DEFAULT_AUTH_CALLBACK,
  safeCallbackPath,
} from "@/lib/auth/callback-url";
import {
  LOGIN_RATE_LIMIT_ERROR_CODE,
  LOGIN_UNAVAILABLE_ERROR_CODE,
} from "@/lib/auth/auth-error-codes";

export function LoginForm({
  callbackUrl = DEFAULT_AUTH_CALLBACK,
}: {
  callbackUrl?: string;
}) {
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const safeCallbackUrl = safeCallbackPath(callbackUrl);
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
          callbackUrl: safeCallbackUrl,
          redirect: false,
        });
        if (result?.ok) window.location.href = safeCallbackUrl;
        else if (result?.error === LOGIN_RATE_LIMIT_ERROR_CODE)
          setError("尝试有些频繁，请稍后再回来。");
        else if (result?.error === LOGIN_UNAVAILABLE_ERROR_CODE)
          setError("暂时无法登录，请稍后再试。");
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
