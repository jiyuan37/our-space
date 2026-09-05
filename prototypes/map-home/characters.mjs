// 原创头像资源：重新绘制头肩构图，表情与单一道具表达主动状态。
// 移动仅改变少量像素的朝向/节奏，持续身份和道具不随位置更换。
export function character(
  person = "lin",
  pose = "idle",
  frame = 0,
  direction = 1,
  moving = false,
) {
  const lin = person === "lin";
  const hair = lin ? "#684735" : "#343e42";
  const shade = lin ? "#936644" : "#54616a";
  const shirt = lin ? "#bd795d" : "#548576";
  const beat = moving ? [0, 0, -0.6, -0.6, 0, 0, 0.6, 0.6][frame % 8] : 0;
  const glance = moving ? direction * 0.6 : 0;
  const eyes =
    pose === "cup"
      ? '<path d="M13 25q2-3 4 0m8 0q2-3 4 0" fill="none" stroke="#46382f" stroke-width="1.7" stroke-linecap="round"/>'
      : '<path d="M14 24h3v4h-3Zm12 0h3v4h-3Z" fill="#46382f"/><path d="M14 24h1v1h-1Zm12 0h1v1h-1Z" fill="#fff4df"/>';
  const mouth =
    pose === "read"
      ? '<path d="M20 32h4" stroke="#965e49" stroke-width="1.5"/>'
      : '<path d="M19 31q3 4 6 0" fill="none" stroke="#965e49" stroke-width="1.5" stroke-linecap="round"/>';
  const prop =
    pose === "read"
      ? '<g data-prop="book" aria-hidden="true"><path d="M26 35l9 2 9-2v11l-9 2-9-2Z" fill="#6d8261" stroke="#3f5340" stroke-width="1.3"/><path d="M28 36l7 2 7-2v8l-7 2-7-2Z" fill="#fff4df"/><path d="M35 38v8" stroke="#b4a486"/><path d="M29 39l4 1m-4 2 4 1m4-3 4-1m-4 4 4-1" stroke="#b4a486"/></g>'
      : pose === "cup"
        ? '<g data-prop="milk-tea" aria-hidden="true"><path d="M36 29l2-7" stroke="#7c5b40" stroke-width="2"/><path d="M30 31h13l-2 15h-9Z" fill="#d5aa78" stroke="#795b42" stroke-width="1.3"/><path d="M29 30h15v3H29Z" fill="#fff4df" stroke="#795b42"/><path d="M33 41h2v2h-2Zm5 1h2v2h-2Zm-2-4h2v2h-2Z" fill="#674b3b"/><path d="M33 35v4" stroke="#efd7ac" stroke-width="2"/></g>'
        : "";
  return `<svg class="character" data-kind="head-shoulders" data-person="${person}" data-motion="${moving ? "moving" : "still"}" viewBox="0 0 48 50" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g transform="translate(0 ${beat})"><path d="M13 3h16v3h7v6h4v23h-6v4h4v8H6v-8h4v-4H4V14h3V8h6Z" fill="#fff4df" stroke="#fff4df" stroke-width="3" stroke-linejoin="round"/><path d="M13 5h16v3h6v6h3v21h-6v5H9v-5H6V14h3V9h4Z" fill="${hair}"/><path d="M12 39h18v3h6v5H8v-5h4Z" fill="${shirt}"/><path d="M18 36h9v6l-4 3-5-3Z" fill="#edba90"/><path d="M10 18h24v13h-3v5h-5v3h-9v-3h-5v-6h-2Z" fill="#f5caa4"/><path d="M8 23h4v7H8Zm24 0h4v7h-4Z" fill="#edba90"/>${lin ? `<path d="M10 12h5V8h13v4h5v9h-6v-5h-6v4H11v9H8V16h2Z" fill="${hair}"/><path d="M13 10h12v3H13Zm-3 6h3v4h-3Z" fill="${shade}"/><path d="M31 17h5v18h-5Z" fill="${hair}"/><path d="M31 17h5v3h-5Z" fill="#dfb655"/>` : `<path d="M9 16h5v-5h6V7h9v5h6v11h-6v-7h-5v5h-7v-3h-8Z" fill="${hair}"/><path d="M19 10h9v3h-9Zm-6 4h6v3h-6Z" fill="${shade}"/>`}<g transform="translate(${glance} 0)">${eyes}<path d="M12 30h5v2h-5Zm15 0h5v2h-5Z" fill="#e8a88a"/>${mouth}</g>${prop}</g></svg>`;
}
