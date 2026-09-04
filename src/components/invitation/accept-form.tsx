"use client";

import { useActionState } from "react";

import { acceptInvitationAction } from "@/app/actions";
import { PrimaryButton } from "@/components/ui/form-controls";
import { useI18n } from "@/components/i18n/i18n-provider";
import { errorMessageKey } from "@/lib/i18n/errors";

export function AcceptInvitationForm({ token }: { token: string }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(acceptInvitationAction, {});
  return (
    <form action={action}>
      <input type="hidden" name="token" value={token} />
      {state.errorCode && (
        <p role="alert">{t(errorMessageKey(state.errorCode))}</p>
      )}
      <PrimaryButton pending={pending}>
        {pending ? t("invitation.accepting") : t("invitation.accept")}
      </PrimaryButton>
    </form>
  );
}
