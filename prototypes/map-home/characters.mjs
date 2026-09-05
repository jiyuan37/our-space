// 原创大头状态角色：在原 48×50 画布内重画脸型/发型/五官，未放大 marker。
// 无可见细脖子，仅少量衣领。所有阶梯为手绘路径，不使用商业素材。
export function character(
  person = "lin",
  pose = "idle",
  frame = 0,
  direction = 1,
  moving = false,
) {
  const lin = person === "lin";
  const beat = moving ? [0, 0, -0.6, -0.6, 0, 0, 0.6, 0.6][frame % 8] : 0;
  const glance = moving ? direction * 0.6 : 0;
  const hair = lin ? "#694936" : "#39474a";
  const crown = lin
    ? '<path d="M16 3h15v2h6v3h4v5h2v8h1v15h-2v7h-7v-5H12v5H5v-8H3V17h2V11h3V7h8Z"/>'
    : '<path d="M15 3h16v2h6v3h5v5h2v7h1v10h-3v5H7v-4H3V17h2V10h4V6h6Z"/>';
  // 额头、脸颊、下巴采用逐层收拢的像素阶梯，不保留旧尖窄脸轮廓。
  const face =
    '<path data-part="face" d="M14 12h19v3h6v6h3v9h-2v4h-3v3h-5v3H17v-2h-5v-3H8v-4H6v-8h2v-6h6Z" fill="#f5cca6"/><path d="M40 24h2v6h-2v4h-3v3h-5v3H17v-2h14v-2h5v-3h3v-4h1Z" fill="#e9b68e"/>';
  const fringe = lin
    ? `<path d="M9 13h5V9h18v4h5v9h-5v-7h-6v3h-6v2H9v9H6V18h3Z" fill="${hair}"/><path d="M12 9h7V7h12v2h-8v2H12Z" fill="#926749"/><path d="M6 23h4v11h3v8H7v-6H5Z" fill="${hair}"/><path d="M38 19h5v17h-2v6h-6v-5h3Z" fill="${hair}"/><path d="M37 18h4v2h-4Z" fill="#d8b778"/>`
    : `<path d="M7 14h5V9h10V6h9v4h7v5h4v8h-6v-7h-7v4h-8v-3h-8v6H7Z" fill="${hair}"/><path d="M13 10h9V8h8v3h-9v2h-8Z" fill="#5d7171"/>`;
  const expression = lin
    ? `<g data-part="expression" data-expression="gentle-focus"><path d="M13 23h5v1h-5Zm15 0h5v1h-5Z" fill="#91644d"/><path d="M14 26h3v4h-3Zm15 0h3v4h-3Z" fill="#513e33"/><path d="M14 26h1v1h-1Zm15 0h1v1h-1Z" fill="#fff4df"/><path d="M21 34h2v1h3v-1h2v2h-2v1h-3v-1h-2Z" fill="#a06951"/></g>`
    : `<g data-part="expression" data-expression="relaxed-smile"><path d="M12 27h2v-2h4v2h2v2h-2v-2h-4v2h-2Zm15 0h2v-2h4v2h2v2h-2v-2h-4v2h-2Z" fill="#493d32"/><path d="M20 33h2v2h6v-2h2v3h-2v1h-6v-1h-2Z" fill="#945d49"/></g>`;
  // 道具位于五官下方，由手托住；与移动无关，最多一个。
  const prop =
    pose === "read"
      ? '<g data-prop="book" aria-hidden="true"><path d="M24 39h4v1h5v1h2v-1h5v-1h5v9h-5v1h-6v1h-6v-1h-4Z" fill="#668063"/><path d="M26 40h3v1h4v1h1v6h-5v-1h-3Zm10 2h4v-1h3v6h-4v1h-3Z" fill="#fff0d2"/><path d="M28 43h4v1h-4Zm10 0h3v1h-3Z" fill="#b1a384"/><path data-part="hand" d="M21 43h5v2h2v3h-6v-2h-1Z" fill="#f0c09a"/></g>'
      : pose === "cup"
        ? '<g data-prop="milk-tea" aria-hidden="true"><path d="M44 38V29h3v2h-1v7Z" fill="#80634b"/><path d="M35 39h10v3h-1v7h-8v-7h-1Z" fill="#c89b69"/><path d="M34 37h12v3H34Z" fill="#fff0d2"/><path d="M37 41h6v3h-6Z" fill="#e9c18e"/><path d="M37 46h2v2h-2Zm4 0h2v2h-2Z" fill="#73513b"/><path data-part="hand" d="M31 43h5v2h2v3h-2v1h-5Z" fill="#f0c09a"/></g>'
        : "";
  return `<svg class="character" data-kind="big-head" data-person="${person}" data-motion="${moving ? "moving" : "still"}" viewBox="0 0 48 50" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" shape-rendering="crispEdges"><g transform="translate(0 ${beat})"><g data-part="body"><path d="M17 39h15v2h4v5H13v-5h4Z" fill="${lin ? "#b87962" : "#648a78"}"/><path d="M21 40h7v2h-7Z" fill="#f5cca6"/></g><g data-part="head"><g fill="${hair}" stroke="#f6e8d0" stroke-width="1" stroke-linejoin="miter">${crown}</g>${face}${fringe}<g transform="translate(${glance} 0)"><path d="M10 31h7v2h-7Zm22 0h7v2h-7Z" fill="#e9ab91"/>${expression}</g></g>${prop}</g></svg>`;
}
