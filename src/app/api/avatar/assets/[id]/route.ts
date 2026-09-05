import { requireSession } from "@/lib/auth/session";
import { avatarService } from "@/server/avatar/runtime";
import { avatarError, privateHeaders } from "@/server/avatar/http";
export const runtime = "nodejs";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    const bytes = await avatarService().readAsset(
      session.user.userId,
      (await params).id,
    );
    return new Response(new Uint8Array(bytes), {
      headers: {
        ...privateHeaders,
        "Content-Type": "image/png",
        "Content-Disposition": 'inline; filename="avatar.png"',
      },
    });
  } catch (error) {
    return avatarError(error);
  }
}
