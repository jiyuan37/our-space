"use client";

import { useActionState } from "react";

import { acceptInvitationAction } from "@/app/actions";

export function AcceptInvitationForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(acceptInvitationAction, {});
  return (
    <form action={action}>
      <input type="hidden" name="token" value={token} />
      {state.error && <p role="alert">{state.error}</p>}
      <button disabled={pending}>接受邀请</button>
    </form>
  );
}
