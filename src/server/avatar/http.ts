import { ZodError } from "zod";
import {
  DomainError,
  AvatarInvalidPhotoError,
} from "@/server/errors/domain-error";
import { AVATAR } from "@/lib/avatar/config";
export const privateHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  Vary: "Cookie",
};
export function avatarError(error: unknown) {
  return Response.json(
    {
      errorCode:
        error instanceof DomainError
          ? error.code
          : error instanceof ZodError
            ? "INVALID_INPUT"
            : "UNEXPECTED_ERROR",
    },
    {
      status:
        error instanceof DomainError
          ? error.statusCode
          : error instanceof ZodError
            ? 400
            : 500,
      headers: privateHeaders,
    },
  );
}
export async function limitedForm(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data;"))
    throw new AvatarInvalidPhotoError();
  if (Number(request.headers.get("content-length") ?? 0) > AVATAR.maxBodyBytes)
    throw new AvatarInvalidPhotoError();
  const reader = request.body?.getReader();
  if (!reader) throw new AvatarInvalidPhotoError();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > AVATAR.maxBodyBytes) {
      await reader.cancel();
      throw new AvatarInvalidPhotoError();
    }
    chunks.push(value);
  }
  return new Response(Buffer.concat(chunks), {
    headers: { "Content-Type": request.headers.get("content-type")! },
  }).formData();
}
