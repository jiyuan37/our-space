import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export type ProviderOutcome =
  | "success"
  | "timeout"
  | "http_error"
  | "transport_error"
  | "incomplete"
  | "response_rejected";

export type ProviderEndpoint = {
  name: string;
  url: string;
};

type EndpointHealth = {
  consecutiveFailures: number;
  circuitOpenUntil: number;
  lastCheckedAt: number;
  lastLatencyMs: number;
  lastOutcome: ProviderOutcome;
};

type HealthState = { endpoints: Record<string, EndpointHealth> };

export interface ProviderHealth {
  select(endpoints: readonly ProviderEndpoint[]): Promise<ProviderEndpoint>;
  record(
    endpoint: ProviderEndpoint,
    result: { outcome: ProviderOutcome; latencyMs: number },
  ): Promise<void>;
}

const endpointName = /^[a-z0-9-]{1,40}$/;

export function validateProviderEndpoints(
  endpoints: readonly ProviderEndpoint[],
): ProviderEndpoint[] {
  if (!endpoints.length) throw new Error("MAP_PROVIDER_NOT_CONFIGURED");
  return endpoints.map((endpoint) => {
    const url = new URL(endpoint.url);
    if (
      !endpointName.test(endpoint.name) ||
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      throw new Error("MAP_PROVIDER_NOT_APPROVED");
    return { name: endpoint.name, url: url.toString() };
  });
}

/**
 * Persists only endpoint operational health. Selection rotates after a failure,
 * but a logical map read still sends exactly one upstream request.
 */
export class FileProviderHealth implements ProviderHealth {
  constructor(
    private readonly root: string,
    private readonly now: () => number = Date.now,
  ) {}

  private async load(): Promise<HealthState> {
    try {
      return JSON.parse(
        await readFile(path.join(this.root, "provider-health.json"), "utf8"),
      ) as HealthState;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT")
        return { endpoints: {} };
      throw error;
    }
  }

  private async save(state: HealthState) {
    await mkdir(this.root, { recursive: true, mode: 0o700 });
    const target = path.join(this.root, "provider-health.json");
    const temporary = `${target}.tmp`;
    await writeFile(temporary, JSON.stringify(state), { mode: 0o600 });
    await rename(temporary, target);
  }

  async select(endpoints: readonly ProviderEndpoint[]) {
    const approved = validateProviderEndpoints(endpoints);
    const state = await this.load();
    const now = this.now();
    const available = approved.filter(
      (endpoint) =>
        (state.endpoints[endpoint.name]?.circuitOpenUntil ?? 0) <= now,
    );
    if (!available.length) {
      const retryAt = Math.min(
        ...approved.map(
          (endpoint) => state.endpoints[endpoint.name]?.circuitOpenUntil ?? now,
        ),
      );
      throw new ProviderCircuitOpenError(retryAt);
    }
    return available.sort((left, right) => {
      const a = state.endpoints[left.name];
      const b = state.endpoints[right.name];
      if (!a && !b) return 0;
      if (!a) return -1;
      if (!b) return 1;
      return a.lastCheckedAt - b.lastCheckedAt;
    })[0];
  }

  async record(
    endpoint: ProviderEndpoint,
    result: { outcome: ProviderOutcome; latencyMs: number },
  ) {
    if (!endpointName.test(endpoint.name))
      throw new Error("MAP_PROVIDER_NOT_APPROVED");
    const state = await this.load();
    const previous = state.endpoints[endpoint.name];
    const failures =
      result.outcome === "success"
        ? 0
        : Math.min(8, (previous?.consecutiveFailures ?? 0) + 1);
    const backoffMs = failures
      ? Math.min(15 * 60_000, 30_000 * 2 ** (failures - 1))
      : 0;
    state.endpoints[endpoint.name] = {
      consecutiveFailures: failures,
      circuitOpenUntil: this.now() + backoffMs,
      lastCheckedAt: this.now(),
      lastLatencyMs: Math.max(0, Math.round(result.latencyMs)),
      lastOutcome: result.outcome,
    };
    await this.save(state);
  }
}

export class ProviderCircuitOpenError extends Error {
  constructor(readonly retryAt: number) {
    super("MAP_PROVIDER_BACKOFF");
  }
}
