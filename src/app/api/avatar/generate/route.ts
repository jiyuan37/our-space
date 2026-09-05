import { requireSession } from "@/lib/auth/session";
import { validateServerEnv } from "@/lib/env";
import { avatarService } from "@/server/avatar/runtime";
import { avatarError, limitedForm, privateHeaders } from "@/server/avatar/http";
import { AvatarInvalidPhotoError } from "@/server/errors/domain-error";
import { rateLimiter } from "@/server/rate-limit/default-limiter";
import {
  enforceRateLimit,
  privateBucket,
} from "@/server/rate-limit/rate-limiter";
export const runtime = "nodejs";
export const maxDuration = 180;
export async function POST(request: Request) {
  try {
    if (
      request.headers.get("origin") !==
      new URL(validateServerEnv().APP_URL).origin
    )
      return Response.json(
        { errorCode: "INVALID_INPUT" },
        { status: 403, headers: privateHeaders },
      );
    const session = await requireSession();
    await enforceRateLimit(rateLimiter, {
      key: privateBucket("avatar-upload", session.user.userId),
      limit: 10,
      windowMs: 60_000,
    });
    const service = avatarService(true);
    const data = await limitedForm(request);
    const file = data.get("photo");
    if (!(file instanceof File)) throw new AvatarInvalidPhotoError();
    const job = await service.generateOwn(
      session.user.userId,
      String(data.get("requestId")),
      data.get("consent"),
      Buffer.from(await file.arrayBuffer()),
      file.type,
    );
    return Response.json(job, { headers: privateHeaders });
  } catch (error) {
    return avatarError(error);
  }
}
