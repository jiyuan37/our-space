import { requireSession } from "@/lib/auth/session";
import { mapService } from "@/server/map/runtime";
import { MapReadError } from "@/server/map/service";
import { DomainError } from "@/server/errors/domain-error";
export const runtime = "nodejs";
const headers = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
  Vary: "Cookie",
};
export async function GET(request: Request) {
  try {
    const session = await requireSession();
    return Response.json(
      await mapService().read(
        session.user.userId,
        new URL(request.url).searchParams.get("area"),
      ),
      { headers },
    );
  } catch (error) {
    return Response.json(
      {
        ...(error instanceof MapReadError && error.retryAt
          ? { retryAt: error.retryAt }
          : {}),
        errorCode:
          error instanceof DomainError || error instanceof MapReadError
            ? error.code
            : "MAP_UNAVAILABLE",
      },
      {
        headers: {
          ...headers,
          ...(error instanceof MapReadError && error.retryAt
            ? {
                "Retry-After": String(
                  Math.max(1, Math.ceil((error.retryAt - Date.now()) / 1000)),
                ),
              }
            : {}),
        },
        status:
          error instanceof DomainError
            ? error.statusCode
            : error instanceof MapReadError && error.code === "MAP_INVALID_AREA"
              ? 400
              : 503,
      },
    );
  }
}
