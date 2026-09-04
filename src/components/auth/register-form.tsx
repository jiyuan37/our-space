"use client";

import { useActionState } from "react";

import { registerAction } from "@/app/actions";
import {
  FormField,
  Notice,
  PrimaryButton,
} from "@/components/ui/form-controls";
import {
  DEFAULT_AUTH_CALLBACK,
  safeCallbackPath,
} from "@/lib/auth/callback-url";
import { useI18n } from "@/components/i18n/i18n-provider";
import { errorMessageKey } from "@/lib/i18n/errors";

export function RegisterForm({
  callbackUrl = DEFAULT_AUTH_CALLBACK,
}: {
  callbackUrl?: string;
}) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(registerAction, {});
  return (
    <form action={action} className="calm-form">
      <input
        type="hidden"
        name="callbackUrl"
        value={safeCallbackPath(callbackUrl)}
      />
      <FormField
        label={t("register.name")}
        id="name"
        name="name"
        required
        maxLength={80}
      />
      <FormField
        label={t("register.email")}
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
      />
      <FormField
        label={t("register.password")}
        id="password"
        name="password"
        type="password"
        minLength={15}
        maxLength={128}
        required
        autoComplete="new-password"
        hint={t("register.passwordHint")}
      />
      {state.errorCode && (
        <Notice tone="error">{t(errorMessageKey(state.errorCode))}</Notice>
      )}
      <PrimaryButton pending={pending}>
        {pending ? t("register.preparing") : t("register.submit")}
      </PrimaryButton>
    </form>
  );
}
