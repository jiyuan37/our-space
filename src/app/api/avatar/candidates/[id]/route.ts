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
    const image = await avatarService().readCandidateImage(
      session.user.userId,
      (await params).id,
    );
    return new Response(new Uint8Array(image.bytes), {
      headers: {
        ...privateHeaders,
        "Content-Type": image.mimeType,
        "Content-Disposition": `inline; filename="avatar.${image.mimeType === "image/jpeg" ? "jpg" : "png"}"`,
      },
    });
  } catch (error) {
    return avatarError(error);
  }
}
