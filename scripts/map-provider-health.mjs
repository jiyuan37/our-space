import { createHash } from "node:crypto";

const endpoints = [
  ["overpass-api-de", "https://overpass-api.de/api/interpreter"],
  ["kumi-systems", "https://overpass.kumi.systems/api/interpreter"],
  ["private-coffee", "https://overpass.private.coffee/api/interpreter"],
];
const query = "[out:json][timeout:5];node(1);out;";
const queryHash = createHash("sha256").update(query).digest("hex").slice(0, 16);

for (const [endpoint, url] of endpoints) {
  const started = performance.now();
  let result;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "OurSpace/0.1 MAP-01A provider-health",
        Accept: "application/json",
      },
      body: new URLSearchParams({ data: query }),
      signal: AbortSignal.timeout(15_000),
      redirect: "error",
    });
    const text = await response.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {}
    result = {
      endpoint,
      queryHash,
      latencyMs: Math.round(performance.now() - started),
      success:
        response.ok && !parsed?.remark && Array.isArray(parsed?.elements),
      status: response.status,
      incomplete:
        response.ok && (!parsed || !Array.isArray(parsed.elements))
          ? true
          : Boolean(parsed?.remark),
      remark: typeof parsed?.remark === "string" ? parsed.remark : undefined,
      elementCount: Array.isArray(parsed?.elements)
        ? parsed.elements.length
        : undefined,
      responseBytes: Buffer.byteLength(text),
    };
  } catch (error) {
    const cause = error instanceof Error ? error.cause : undefined;
    result = {
      endpoint,
      queryHash,
      latencyMs: Math.round(performance.now() - started),
      success: false,
      incomplete: false,
      error:
        error instanceof Error ? `${error.name}: ${error.message}` : "unknown",
      transportCode:
        cause && typeof cause === "object" && "code" in cause
          ? String(cause.code)
          : undefined,
    };
  }
  console.log(JSON.stringify(result));
}
