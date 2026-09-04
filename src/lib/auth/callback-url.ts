export const DEFAULT_AUTH_CALLBACK = "/home";

export function safeCallbackPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_AUTH_CALLBACK;
  }

  if (value.includes("\\")) return DEFAULT_AUTH_CALLBACK;

  try {
    const baseUrl = new URL("http://our-space.local");
    const parsed = new URL(value, baseUrl);
    if (parsed.origin !== baseUrl.origin) return DEFAULT_AUTH_CALLBACK;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return DEFAULT_AUTH_CALLBACK;
  }
}
