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
import { useI18n } from "@/components/i18n/i18n-provider";
import { errorMessageKey, type UiErrorCode } from "@/lib/i18n/errors";

export function LoginForm({
  callbackUrl = DEFAULT_AUTH_CALLBACK,
}: {
  callbackUrl?: string;
}) {
  const { t } = useI18n();
  const [errorCode, setErrorCode] = useState<UiErrorCode>();
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
          setErrorCode("RATE_LIMIT_EXCEEDED");
        else if (result?.error === LOGIN_UNAVAILABLE_ERROR_CODE)
          setErrorCode("AUTHENTICATION_UNAVAILABLE");
        else setErrorCode("INVALID_CREDENTIALS");
      }}
    >
      <FormField
        label={t("login.email")}
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
      />
      <FormField
        label={t("login.password")}
        id="password"
        name="password"
        type="password"
        required
        autoComplete="current-password"
      />
      {errorCode && (
        <Notice tone="error">{t(errorMessageKey(errorCode))}</Notice>
      )}
      <PrimaryButton pending={!ready}>
        {ready ? t("login.submit") : t("login.preparing")}
      </PrimaryButton>
    </form>
  );
}
