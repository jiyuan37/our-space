// 可复现的原创参考；只取已批准提交的 idle 无道具角色，不改动原型。
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { character } from "../prototypes/map-home/characters.mjs";
const commit = "b6fe15a8c11270d3c1568f7f40af08484ce71fd3";
const approved = execFileSync(
  "git",
  ["show", `${commit}:prototypes/map-home/characters.mjs`],
  { encoding: "utf8" },
);
if (
  approved !==
  readFileSync(
    new URL("../prototypes/map-home/characters.mjs", import.meta.url),
    "utf8",
  )
)
  throw new Error(
    "Approved character source has changed; reference requires explicit review",
  );
const head = (person, x) =>
  `<g transform="translate(${x} 60) scale(4)">${character(person, "idle")
    .replace(/^<svg[^>]*>/, "")
    .replace(/<\/svg>$/, "")}</g>`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" viewBox="0 0 480 320" shape-rendering="crispEdges"><!-- Original Our Space style, ${commit}; idle, no props -->\n<path fill="#fff4df" d="M0 0h480v320H0z"/>${head("lin", 24)}${head("yu", 264)}</svg>\n`;
writeFileSync(
  new URL("../src/server/avatar/style-reference.svg", import.meta.url),
  svg,
);
