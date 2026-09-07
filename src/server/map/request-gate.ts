import {
  mkdir,
  open,
  readFile,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

export class OverpassBackoffError extends Error {
  constructor(readonly retryAt: number) {
    super("MAP_PROVIDER_BACKOFF");
  }
}
export class OverpassHttpError extends Error {
  constructor(
    readonly status: number,
    readonly retryAfterMs = 30000,
  ) {
    super("MAP_PROVIDER_UNAVAILABLE");
  }
}
export interface RequestGate {
  run<T>(
    work: (byteLimit: number) => Promise<{ value: T; bytes: number }>,
  ): Promise<T>;
}
type GateState = {
  day: string;
  requests: number;
  bytes: number;
  nextAllowedAt: number;
  lastOutcome?: "success" | "failed";
  lastHttpStatus?: number;
  lastFailure?: string;
  lastTransportCode?: string;
};
const MAX_DAILY_BYTES = 10 * 1024 * 1024;
// 单主机早期运行：所有 Node worker 共用磁盘锁与预算，不依赖各自进程内计数。
export class FileOverpassGate implements RequestGate {
  constructor(
    private readonly root: string,
    private readonly now: () => number = Date.now,
  ) {}
  async run<T>(
    work: (byteLimit: number) => Promise<{ value: T; bytes: number }>,
  ): Promise<T> {
    await mkdir(this.root, { recursive: true, mode: 0o700 });
    const lockPath = path.join(this.root, "overpass.lock");
    let lock;
    try {
      lock = await open(lockPath, "wx", 0o600);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "EEXIST")
        throw new OverpassBackoffError(this.now() + 30000);
      throw error;
    }
    const statePath = path.join(this.root, "overpass-budget.json");
    const save = async (state: GateState) => {
      const tmp = `${statePath}.tmp`;
      await writeFile(tmp, JSON.stringify(state), { mode: 0o600 });
      await rename(tmp, statePath);
    };
    try {
      const now = this.now(),
        day = new Date(now).toISOString().slice(0, 10);
      let state: GateState = { day, requests: 0, bytes: 0, nextAllowedAt: 0 };
      try {
        state = JSON.parse(await readFile(statePath, "utf8"));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
      if (state.nextAllowedAt > now)
        throw new OverpassBackoffError(state.nextAllowedAt);
      if (state.day !== day)
        state = {
          day,
          requests: 0,
          bytes: 0,
          nextAllowedAt: state.nextAllowedAt,
        };
      if (state.requests >= 10 || state.bytes >= MAX_DAILY_BYTES)
        throw new OverpassBackoffError(
          Date.parse(`${day}T00:00:00Z`) + 86400000,
        );
      const limit = Math.min(5 * 1024 * 1024, MAX_DAILY_BYTES - state.bytes);
      delete state.lastHttpStatus;
      delete state.lastTransportCode;
      delete state.lastFailure;
      // 发送前持久预留请求及字节预算；崩溃/失败也不能通过重启规避预算。
      state.requests++;
      state.bytes += limit;
      state.nextAllowedAt = now + 120000;
      await save(state);
      try {
        const result = await work(limit);
        state.lastOutcome = "success";
        delete state.lastFailure;
        delete state.lastHttpStatus;
        state.bytes -= limit - result.bytes;
        state.nextAllowedAt = this.now() + 30000;
        await save(state);
        return result.value;
      } catch (error) {
        state.lastOutcome = "failed";
        if (error instanceof OverpassHttpError)
          state.lastHttpStatus = error.status;
        // 固定错误分类；不存完整异常、请求内容、用户字段或上游响应正文。
        state.lastFailure =
          error instanceof Error &&
          [
            "MAP_PROVIDER_TOO_LARGE",
            "MAP_PROVIDER_INCOMPLETE",
            "MAP_NO_GEOGRAPHY",
          ].includes(error.message)
            ? error.message
            : error instanceof OverpassHttpError
              ? "HTTP_ERROR"
              : error instanceof Error &&
                  ["TimeoutError", "AbortError"].includes(error.name)
                ? "TIMEOUT"
                : error instanceof TypeError
                  ? "TRANSPORT_ERROR"
                  : "LOCAL_PROCESSING_ERROR";
        const cause =
          error instanceof Error
            ? (error.cause as { code?: unknown } | undefined)
            : undefined;
        if (
          typeof cause?.code === "string" &&
          [
            "UND_ERR_CONNECT_TIMEOUT",
            "ECONNRESET",
            "ENOTFOUND",
            "ECONNREFUSED",
            "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
            "CERT_HAS_EXPIRED",
            "DEPTH_ZERO_SELF_SIGNED_CERT",
            "ETIMEDOUT",
          ].includes(cause.code)
        )
          state.lastTransportCode = cause.code;
        state.nextAllowedAt =
          this.now() +
          Math.max(
            30000,
            error instanceof OverpassHttpError ? error.retryAfterMs : 30000,
          );
        await save(state);
        throw error;
      }
    } finally {
      await lock.close();
      await unlink(lockPath);
    }
  }
}
export function retryAfterMilliseconds(
  header: string | null,
  now = Date.now(),
): number {
  if (!header) return 30000;
  const seconds = Number(header);
  const delay =
    Number.isFinite(seconds) && seconds >= 0
      ? seconds * 1000
      : Date.parse(header) - now;
  return Number.isFinite(delay) ? Math.max(30000, delay) : 30000;
}
