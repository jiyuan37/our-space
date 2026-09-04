"use client";

import { signOut } from "next-auth/react";
import { useActionState } from "react";

import {
  createInvitationAction,
  createSpaceAction,
  revokeInvitationAction,
} from "@/app/actions";
import { PrimaryButton, SecondaryButton } from "@/components/ui/form-controls";

export function CreateSpaceForm() {
  const [state, action, pending] = useActionState(createSpaceAction, {});
  return (
    <form action={action} className="calm-form">
      <label htmlFor="space-name">Space 名称</label>
      <input id="space-name" name="name" required maxLength={80} />
      {state.error && <p role="alert">{state.error}</p>}
      <PrimaryButton pending={pending}>Create our space</PrimaryButton>
    </form>
  );
}

export function InvitationForm() {
  const [state, action, pending] = useActionState(createInvitationAction, {});
  return (
    <>
      <form action={action} className="calm-form">
        <label htmlFor="invite-email">邀请邮箱（可选）</label>
        <input id="invite-email" name="email" type="email" />
        {state.error && <p role="alert">{state.error}</p>}
        {state.invitationUrl && (
          <label>
            邀请链接
            <input readOnly value={state.invitationUrl} aria-label="邀请链接" />
          </label>
        )}
        <PrimaryButton pending={pending}>
          Invite someone important
        </PrimaryButton>
      </form>
      {state.invitationId && (
        <RevokeInvitationForm invitationId={state.invitationId} />
      )}
    </>
  );
}

function RevokeInvitationForm({ invitationId }: { invitationId: string }) {
  const [state, action, pending] = useActionState(revokeInvitationAction, {});
  return (
    <form action={action} className="calm-form">
      {state.error && <p role="alert">{state.error}</p>}
      <SecondaryButton
        disabled={pending}
        name="invitationId"
        value={invitationId}
      >
        撤销这份邀请
      </SecondaryButton>
    </form>
  );
}

export function LogoutButton() {
  return (
    <SecondaryButton
      type="button"
      onClick={() => signOut({ callbackUrl: "/welcome" })}
    >
      登出
    </SecondaryButton>
  );
}
