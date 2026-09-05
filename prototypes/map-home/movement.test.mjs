import test from "node:test";
import assert from "node:assert/strict";
import {
  decide,
  scenario,
  A,
  B,
  CONFIG,
  cursorKey,
  currentPresence,
} from "./movement.mjs";
const now = 1788570000000;
for (const [name, state] of Object.entries({
  quiet: "NO_CHANGE",
  baseline: "NO_BASELINE",
  noise: "NO_CHANGE",
  nodata: "INSUFFICIENT_DATA",
  stale: "INSUFFICIENT_DATA",
  paused: "SHARING_PAUSED",
  gap: "INSUFFICIENT_DATA",
  move: "MOVEMENT_AVAILABLE",
  sampled: "MOVEMENT_AVAILABLE",
  return: "MOVEMENT_AVAILABLE",
}))
  test(name, () => assert.equal(decide(scenario(name, now)).state, state));
test("完成/跳过游标阻止同段重复", () => {
  const input = scenario("move", now),
    r = decide(input);
  assert.equal(decide({ ...input, seen: r.consume }).state, "SETTLED");
});
test("端点与采样语义区分", () => {
  assert.equal(decide(scenario("move", now)).segments[0].mode, "endpoints");
  assert.equal(decide(scenario("sampled", now)).segments[0].mode, "sampled");
});
test("往返不能被终点相同吞掉", () => {
  const r = decide(scenario("return", now));
  assert.equal(r.segments.length, 2);
  assert.deepEqual(r.point, A);
});
test("乱序/异常跳点不回放", () => {
  for (const delta of [60000, -179999]) {
    const input = scenario("move", now);
    input.samples[1].at = now + delta;
    assert.equal(decide(input).state, "INSUFFICIENT_DATA");
  }
});
test("重复 id 不产生新变化", () => {
  const input = scenario("move", now);
  input.samples[1].id = "a";
  assert.equal(decide(input).state, "NO_BASELINE");
});
test("低质量尾点不能持续暗示旧位置", () => {
  const input = scenario("move", now);
  input.samples[1].accuracy = 500;
  assert.equal(decide(input).point, null);
});
test("权限代次变化不跨暂停拼接", () => {
  const input = scenario("move", now);
  input.samples[0].epoch = "old";
  const r = decide(input);
  assert.equal(r.segments.length, 0);
  assert.equal(r.point, null);
});
test("撤销访问优先于旧游标", () => {
  const input = scenario("move", now);
  assert.equal(
    decide({ ...input, sharing: "revoked", seen: ["demo:a>b"] }).point,
    null,
  );
});
test("多段有界且明确省略", () => {
  const input = scenario("return", now);
  input.samples = Array.from({ length: 8 }, (_, i) => ({
    ...input.samples[0],
    id: `s${i}`,
    at: now - 480000 + i * 60000,
    point: i % 2 ? B : A,
  }));
  const r = decide(input);
  assert.equal(r.segments.length, CONFIG.maxSegments);
  assert.equal(r.omitted, 4);
  assert.equal(r.consume.length, 7);
});
test("长距离走镜头切换分支", () => {
  const input = scenario("move", now);
  input.samples[1].point = [A[0] + 0.055, A[1]];
  assert.equal(decide(input).long, true);
});
test("按查看账户/Space/共享代次隔离游标", () =>
  assert.equal(
    new Set([
      cursorKey("a", "s", "e"),
      cursorKey("b", "s", "e"),
      cursorKey("a", "t", "e"),
      cursorKey("a", "s", "f"),
    ]).size,
    4,
  ));
test("Presence 清除/跨日不保留动作", () => {
  const today = new Date(2026, 8, 5, 12);
  assert.equal(currentPresence(new Date(2026, 8, 5, 8), today), true);
  assert.equal(currentPresence(new Date(2026, 8, 4, 23), today), false);
  assert.equal(currentPresence(today, today, true), false);
});
test("NaN/越界坐标被拒绝", () => {
  for (const point of [
    [NaN, 0],
    [0, 91],
    [181, 0],
  ]) {
    const input = scenario("move", now);
    input.samples[1].point = point;
    assert.equal(decide(input).point, null);
  }
});
