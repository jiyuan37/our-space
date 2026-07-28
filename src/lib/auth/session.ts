import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/auth-options";
import { AuthenticationRequiredError } from "@/server/errors/domain-error";

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.userId) throw new AuthenticationRequiredError();
  return session;
}
