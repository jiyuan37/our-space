// 原创 SVG 角色：阶梯轮廓 + 柔和表情。8 个步态与地图位移独立。
export function character(
  person = "lin",
  pose = "idle",
  frame = 0,
  direction = 1,
) {
  const lin = person === "lin",
    hair = lin ? "#554136" : "#353d41",
    shirt = lin ? "#9b5848" : "#567564",
    pants = lin ? "#6a695d" : "#596579";
  const steps = [0, 2, 3, 2, 0, -2, -3, -2],
    step = pose === "walk" ? steps[frame % 8] : 0;
  return `<svg viewBox="0 0 40 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g transform="${direction < 0 ? "translate(40 0) scale(-1 1)" : ""}"><g transform="scale(1 .75)"><path d="M12 3h16v3h5v6h3v17h-4v5H8v-5H4V12h3V6h5Z" fill="${hair}"/><path d="M10 13h20v16h-3v4H13v-4h-3Z" fill="#f2c69e"/><path d="M9 9h22v6H18v-3h-5v7H9Z" fill="${hair}"/>${lin ? '<path d="M29 13h5v22h-6v-6h2Z" fill="' + hair + '"/><rect x="28" y="10" width="5" height="3" rx="1" fill="#e7ba79"/>' : '<path d="M10 8h8V4h8v6h5v6H19V13h-9Z" fill="' + hair + '"/>'}<path d="M14 22v2m12-2v2" stroke="#3e3831" stroke-width="2.2" stroke-linecap="round"/><path d="M18 27q2 2 4 0" fill="none" stroke="#915b46" stroke-width="1.2"/></g><g transform="translate(0 -18.2) scale(1 1.3)"><path d="M12 34h16v3h4v16H8V37h4Z" fill="${shirt}"/><path d="M17 34l3 4 3-4" fill="#fff4df"/><path d="M12 51h7v${8 + step}h-9v-3h2Zm10 0h7v${8 - step}h-9v-3h2Z" fill="${pants}"/><path d="M10 ${59 + step}h10v3H8v-3Zm11 ${59 - step}h10v3H21Z" fill="#3e3831"/>${pose === "read" ? '<path d="M8 42l12 3 12-3v11l-12 3-12-3Z" fill="#fff4df" stroke="#3e3831" stroke-width="1.5"/><path d="M20 45v11" stroke="#9a7b55"/><path d="M6 43h5v5H6Zm23 0h5v5h-5Z" fill="#f2c69e"/>' : pose === "cup" ? '<path d="M7 41h7v5h-7Zm19 0h7v5h-7Z" fill="#f2c69e"/><path d="M16 42h10v9H16Z" fill="#fff4df" stroke="#3e3831"/><path d="M26 43h4v5h-4" fill="none" stroke="#3e3831"/>' : `<path d="M6 ${39 - step}h5v12H6Zm23 ${39 + step}h5v12h-5Z" fill="${shirt}"/><path d="M6 ${49 - step}h5v4H6Zm23 ${49 + step}h5v4h-5Z" fill="#f2c69e"/>`}</g></g></svg>`;
}
