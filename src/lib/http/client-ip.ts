type HeaderReader = { get(name: string): string | null };

export function getClientIp(headers: HeaderReader): string {
  if (process.env.TRUST_PROXY === "true") {
    const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    if (forwarded) return forwarded;
  }
  return "direct-or-untrusted-proxy";
}
