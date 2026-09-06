import { AvatarPipelineError } from "./pipeline-error";

export class AvatarNormalizeError extends AvatarPipelineError {
  constructor(
    readonly reason: "BACKGROUND_NOT_UNIFORM" | "FOREGROUND_NOT_SEPARABLE",
  ) {
    super("AVATAR_IMAGE_NORMALIZE_FAILED");
  }
}
const median = (values: number[]) =>
  values.sort((a, b) => a - b)[Math.floor(values.length / 2)];
const distance = (a: number[], b: number[]) =>
  Math.hypot(...a.map((v, i) => v - b[i]));

// 全分辨率、只从边缘连通区域去背景。颜色由边缘统计估计，不预设色相。
// 无法可靠区分的复杂背景明确失败；不猜测人物分割，也不修改保留像素的 RGB。
export function removeUniformBackground(
  input: Buffer,
  width: number,
  height: number,
) {
  const data = Buffer.from(input);
  const border: number[] = [];
  for (let x = 0; x < width; x++) border.push(x, (height - 1) * width + x);
  for (let y = 1; y < height - 1; y++)
    border.push(y * width, y * width + width - 1);
  const rgb = (p: number) => [data[p * 4], data[p * 4 + 1], data[p * 4 + 2]];
  const transparent =
    border.filter((p) => data[p * 4 + 3] < 16).length / border.length;
  let background: number[] | null = null;
  let tolerance = 0;
  if (transparent < 0.85) {
    const colors = border.filter((p) => data[p * 4 + 3] >= 240).map(rgb);
    if (colors.length < border.length * 0.85)
      throw new AvatarNormalizeError("BACKGROUND_NOT_UNIFORM");
    background = [0, 1, 2].map((c) => median(colors.map((v) => v[c])));
    const distances = colors
      .map((c) => distance(c, background!))
      .sort((a, b) => a - b);
    // 允许轻微 JPEG 压缩/近似纯色变化；拒绝纹理/渐变背景，避免向主体蔓延。
    const spread = distances[Math.floor(distances.length * 0.9)];
    if (spread > 18) throw new AvatarNormalizeError("BACKGROUND_NOT_UNIFORM");
    tolerance = Math.min(48, Math.max(32, spread * 3 + 12));
  }
  const seen = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0,
    tail = 0,
    removed = 0;
  const visit = (p: number) => {
    if (seen[p]) return;
    seen[p] = 1;
    if (
      data[p * 4 + 3] < 16 ||
      (background && distance(rgb(p), background) <= tolerance)
    )
      queue[tail++] = p;
  };
  border.forEach(visit);
  while (head < tail) {
    const p = queue[head++];
    data[p * 4 + 3] = 0;
    removed++;
    const x = p % width,
      y = Math.floor(p / width);
    if (x > 0) visit(p - 1);
    if (x + 1 < width) visit(p + 1);
    if (y > 0) visit(p - width);
    if (y + 1 < height) visit(p + width);
  }
  // JPEG 边缘可能混入背景色。仅在紧邻透明区域的边界像素，用附近不透明
  // 前景估计局部混色 alpha；不收缩轮廓、不改脸部内部或无可靠估计的像素。
  if (background) {
    const original = Buffer.from(data);
    for (let y = 1; y < height - 1; y++)
      for (let x = 1; x < width - 1; x++) {
        const p = y * width + x,
          offset = p * 4;
        if (
          !original[offset + 3] ||
          ![p - 1, p + 1, p - width, p + width].some(
            (q) => original[q * 4 + 3] === 0,
          )
        )
          continue;
        const observed = [0, 1, 2].map((c) => original[offset + c]);
        let best: { color: number[]; alpha: number; residual: number } | null =
          null;
        for (let dy = -8; dy <= 8; dy++)
          for (let dx = -8; dx <= 8; dx++) {
            const nx = x + dx,
              ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
            const q = (ny * width + nx) * 4;
            if (original[q + 3] !== 255) continue;
            const color = [0, 1, 2].map((c) => original[q + c]);
            const vector = color.map((v, c) => v - background![c]);
            const norm = vector.reduce((a, v) => a + v * v, 0);
            if (norm < 1600) continue;
            const alpha =
              vector.reduce(
                (a, v, c) => a + v * (observed[c] - background![c]),
                0,
              ) / norm;
            if (alpha < 0.1 || alpha >= 0.95) continue;
            const residual = distance(
              observed,
              color.map(
                (v, c) => background![c] + alpha * (v - background![c]),
              ),
            );
            if (residual <= 8 && (!best || residual < best.residual))
              best = { color, alpha, residual };
          }
        if (best) {
          for (let c = 0; c < 3; c++) data[offset + c] = best.color[c];
          data[offset + 3] = Math.round(original[offset + 3] * best.alpha);
        }
      }
  }
  let visible = 0;
  for (let p = 0; p < width * height; p++)
    if (data[p * 4 + 3] >= 128) visible++;
  const clear =
    border.filter((p) => data[p * 4 + 3] === 0).length / border.length;
  if (
    visible < width * height * 0.08 ||
    visible > width * height * 0.92 ||
    clear < 0.8
  )
    throw new AvatarNormalizeError("FOREGROUND_NOT_SEPARABLE");
  return { data, removed, visible, borderClearRatio: clear };
}
