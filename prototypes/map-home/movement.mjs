// 所有数值仅用于合成样本打样，生产前必须实测校准。
export const CONFIG = Object.freeze({
  minMeters: 18,
  maxAccuracy: 60,
  maxAgeMs: 15 * 60_000,
  maxGapMs: 5 * 60_000,
  maxSpeed: 70,
  longMeters: 3000,
  replayMs: 3000,
  maxSegments: 3,
});
export const A = [-0.11835, 51.5037],
  B = [-0.1181, 51.5048],
  SELF = [-0.1169, 51.5041];
export function meters(a, b) {
  const rad = Math.PI / 180;
  const dlat = (b[1] - a[1]) * rad,
    dlon = (b[0] - a[0]) * rad;
  const h =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dlon / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}
export function cursorKey(account, space, epoch) {
  return `our-space-prototype:v1:${encodeURIComponent(account)}:${encodeURIComponent(space)}:${encodeURIComponent(epoch)}`;
}
export function decide({
  samples,
  sharing = "active",
  epoch = "demo",
  seen = [],
  now,
  mode = "endpoints",
}) {
  if (sharing !== "active")
    return { state: "SHARING_PAUSED", segments: [], point: null };
  const valid = (s) =>
    s &&
    s.epoch === epoch &&
    Number.isFinite(s.at) &&
    s.at <= now &&
    now - s.at <= CONFIG.maxAgeMs &&
    Number.isFinite(s.accuracy) &&
    s.accuracy > 0 &&
    s.accuracy <= CONFIG.maxAccuracy &&
    Array.isArray(s.point) &&
    s.point.length === 2 &&
    s.point.every(Number.isFinite) &&
    Math.abs(s.point[0]) <= 180 &&
    Math.abs(s.point[1]) <= 90;
  if (!samples.length || !valid(samples.at(-1)))
    return { state: "INSUFFICIENT_DATA", segments: [], point: null };
  const tail = samples.at(-1);
  const segments = [];
  const ids = new Set();
  let prev = null,
    broken = false;
  for (const s of samples) {
    if (!valid(s)) {
      prev = null;
      broken = true;
      continue;
    }
    if (ids.has(s.id)) continue;
    ids.add(s.id);
    if (prev) {
      const dt = s.at - prev.at,
        d = meters(prev.point, s.point);
      if (
        dt <= 0 ||
        dt > CONFIG.maxGapMs ||
        d / (dt / 1000) > CONFIG.maxSpeed
      ) {
        broken = true;
        prev = s;
        continue;
      }
      if (d > Math.max(CONFIG.minMeters, prev.accuracy + s.accuracy))
        segments.push({
          id: `${epoch}:${prev.id}>${s.id}`,
          from: prev.point,
          to: s.point,
          distance: d,
          mode,
        });
    }
    prev = s;
  }
  const unseen = segments.filter((s) => !seen.includes(s.id));
  if (unseen.length) {
    const selected = unseen.slice(-CONFIG.maxSegments);
    return {
      state: "MOVEMENT_AVAILABLE",
      point: tail.point,
      segments: selected,
      consume: unseen.map((s) => s.id),
      omitted: Math.max(0, unseen.length - selected.length),
      long: selected.some((s) => s.distance > CONFIG.longMeters),
    };
  }
  return {
    state: segments.length
      ? "SETTLED"
      : broken
        ? "INSUFFICIENT_DATA"
        : ids.size === 1
          ? "NO_BASELINE"
          : "NO_CHANGE",
    point: broken && !segments.length ? null : tail.point,
    segments: [],
    consume: [],
    omitted: 0,
  };
}
export function scenario(name, now = Date.now()) {
  const sample = (id, point, offset, extra = {}) => ({
    id,
    point,
    at: now + offset,
    accuracy: 4,
    epoch: "demo",
    ...extra,
  });
  const one = sample("a", A, -180000),
    two = sample("b", B, -60000);
  let samples = [one, sample("still", A, -60000)],
    mode = "endpoints",
    sharing = "active";
  if (["move", "seen", "endpoints"].includes(name)) samples = [one, two];
  if (name === "baseline") samples = [two];
  if (name === "noise")
    samples = [one, sample("noise", [A[0] + 0.000015, A[1] + 0.00001], -60000)];
  if (name === "nodata") samples = [];
  if (name === "stale") samples = [sample("old", A, -3600000)];
  if (name === "paused") {
    samples = [one, two];
    sharing = "paused";
  }
  if (name === "sampled") {
    mode = "sampled";
    samples = [one, sample("mid", [-0.1184, 51.5042], -120000), two];
  }
  if (name === "return") {
    mode = "sampled";
    samples = [one, two, sample("back", A, -10000)];
  }
  if (name === "gap") {
    mode = "sampled";
    samples = [sample("gap-a", A, -600000), two];
  }
  if (name === "far") samples = [two];
  return { samples, mode, sharing, epoch: "demo", now };
}
export function currentPresence(updatedAt, now = new Date(), cleared = false) {
  return !cleared && new Date(updatedAt).toDateString() === now.toDateString();
}
