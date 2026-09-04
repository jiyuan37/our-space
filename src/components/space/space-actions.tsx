"use client";

import { signOut } from "next-auth/react";
import { useActionState } from "react";

import {
  createInvitationAction,
  createSpaceAction,
  revokeInvitationAction,
} from "@/app/actions";
import { useI18n } from "@/components/i18n/i18n-provider";
import { PrimaryButton, SecondaryButton } from "@/components/ui/form-controls";
import { errorMessageKey } from "@/lib/i18n/errors";

export function CreateSpaceForm() {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(createSpaceAction, {});
  return (
    <form action={action} className="calm-form">
      <label htmlFor="space-name">{t("space.name")}</label>
      <input id="space-name" name="name" required maxLength={80} />
      {state.errorCode && (
        <p role="alert">{t(errorMessageKey(state.errorCode))}</p>
      )}
      <PrimaryButton pending={pending}>{t("space.create")}</PrimaryButton>
    </form>
  );
}

export function InvitationForm() {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(createInvitationAction, {});
  return (
    <>
      <form action={action} className="calm-form">
        <label htmlFor="invite-email">{t("space.inviteEmail")}</label>
        <input id="invite-email" name="email" type="email" />
        {state.errorCode && (
          <p role="alert">{t(errorMessageKey(state.errorCode))}</p>
        )}
        {state.invitationUrl && (
          <label>
            {t("space.invitationLink")}
            <input
              readOnly
              value={state.invitationUrl}
              aria-label={t("space.invitationLink")}
            />
          </label>
        )}
        <PrimaryButton pending={pending}>{t("space.invite")}</PrimaryButton>
      </form>
      {state.invitationId && (
        <RevokeInvitationForm invitationId={state.invitationId} />
      )}
    </>
  );
}

function RevokeInvitationForm({ invitationId }: { invitationId: string }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(revokeInvitationAction, {});
  return (
    <form action={action} className="calm-form">
      {state.errorCode && (
        <p role="alert">{t(errorMessageKey(state.errorCode))}</p>
      )}
      <SecondaryButton
        disabled={pending}
        name="invitationId"
        value={invitationId}
      >
        {t("space.revoke")}
      </SecondaryButton>
    </form>
  );
}

export function LogoutButton() {
  const { t } = useI18n();
  return (
    <SecondaryButton
      type="button"
      onClick={() => signOut({ callbackUrl: "/welcome" })}
    >
      {t("space.logout")}
    </SecondaryButton>
  );
}
