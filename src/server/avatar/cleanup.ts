import { prisma } from "@/lib/db/prisma";
import { AvatarService } from "@/server/services/avatar-service";
import { LocalAvatarStorage } from "@/server/avatar/storage";
const state = globalThis as typeof globalThis & {
  avatarCleanupTimer?: ReturnType<typeof setInterval>;
};
export function startAvatarCleanup() {
  if (state.avatarCleanupTimer) return;
  let running = false;
  const sweep = async () => {
    if (running) return;
    running = true;
    try {
      const storage = new LocalAvatarStorage();
      await new AvatarService(prisma, storage).cleanup();
      for (const key of await storage.orphanKeys(
        new Date(Date.now() - 60 * 60_000),
      )) {
        if (
          !(await prisma.mediaAsset.findUnique({
            where: { storageKey: key },
            select: { id: true },
          }))
        )
          await storage.remove(key);
      }
    } catch {
      console.error("AVATAR_CLEANUP_FAILED");
    } finally {
      // 仅固定代码，无路径、照片或用户数据。
      running = false;
    }
  };
  void sweep();
  state.avatarCleanupTimer = setInterval(() => void sweep(), 60_000);
  state.avatarCleanupTimer.unref();
}
