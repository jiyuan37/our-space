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
    return Response.json(
      await avatarService().getOwn(session.user.userId, (await params).id),
      { headers: privateHeaders },
    );
  } catch (error) {
    return avatarError(error);
  }
}
