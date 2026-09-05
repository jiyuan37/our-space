import { validateServerEnv } from "@/lib/env";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    validateServerEnv();
    if (process.env.NEXT_PHASE === "phase-production-build") return;
    const { startAvatarCleanup } = await import("./server/avatar/cleanup");
    startAvatarCleanup();
  }
}
