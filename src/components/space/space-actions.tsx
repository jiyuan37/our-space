"use client";

import { signOut } from "next-auth/react";
import { useActionState } from "react";

import {
  createInvitationAction,
  createSpaceAction,
  revokeInvitationAction,
} from "@/app/actions";

export function CreateSpaceForm() {
  const [state, action, pending] = useActionState(createSpaceAction, {});
  return (
    <form action={action} className="calm-form">
      <label htmlFor="space-name">Space 名称</label>
      <input id="space-name" name="name" required maxLength={80} />
      {state.error && <p role="alert">{state.error}</p>}
      <button disabled={pending}>Create our space</button>
    </form>
  );
}

export function InvitationForm() {
  const [state, action, pending] = useActionState(createInvitationAction, {});
  return (
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
      {state.invitationId && (
        <button
          className="button button-secondary"
          formAction={revokeInvitationAction}
          name="invitationId"
          value={state.invitationId}
        >
          撤销这份邀请
        </button>
      )}
      <button disabled={pending}>Invite someone important</button>
    </form>
  );
}

export function LogoutButton() {
  return (
    <button type="button" onClick={() => signOut({ callbackUrl: "/welcome" })}>
      登出
    </button>
  );
}
