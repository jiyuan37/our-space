import { memo, useId } from "react";
import {
  featurePath,
  parkDecorations,
  project,
  type Geography,
} from "@/lib/map/model";

// 原创像素纹理继承已批准原型；无原型人物、固定城市或模拟事件。
export const PixelGeography = memo(function PixelGeography({
  geography,
}: {
  geography: Geography;
}) {
  const prefix = useId().replaceAll(":", "");
  const grass = `${prefix}-grass`,
    water = `${prefix}-water`;
  const [left] = project(
    [geography.bounds[0], geography.bounds[1]],
    geography.bounds,
  );
  const [right] = project(
    [geography.bounds[2], geography.bounds[3]],
    geography.bounds,
  );
  const fills = {
    water: `url(#${water})`,
    park: `url(#${grass})`,
    building: "#d3b99e",
    road: "none",
  };
  return (
    <>
      <defs>
        <clipPath id={`${prefix}-extent`}>
          <rect x={left} y="0" width={right - left} height="800" />
        </clipPath>
        <pattern
          id={grass}
          width="104"
          height="90"
          patternUnits="userSpaceOnUse"
        >
          <rect width="104" height="90" fill="#b8d1a4" />
          <path
            d="M8 14h24v6h-24zM60 62h28v8H60zM70 8h12v4H70z"
            fill="#bed6a9"
          />
          <path
            d="M24 62v-4h3v4m4 0v-3M84 38v-4h3v4"
            fill="none"
            stroke="#9fbd8b"
            strokeWidth="2"
          />
        </pattern>
        <pattern
          id={water}
          width="230"
          height="170"
          patternUnits="userSpaceOnUse"
        >
          <rect width="230" height="170" fill="#aecfe0" />
          <path
            d="M30 42h20v-3h10M136 110h28v-3h9M185 25h16"
            fill="none"
            stroke="#c6e0e7"
            strokeWidth="3"
          />
        </pattern>
        <symbol id={`${prefix}-tree`} viewBox="0 0 32 40">
          <path d="M14 25h5v13h-5z" fill="#967858" />
          <path d="M9 2h14v3h5v5h3v15h-4v5H6v-4H2V11h3V5h4z" fill="#789e68" />
          <path d="M10 3h12v3h5v6h2v10h-4v4H8v-4H4V12h3V6h3z" fill="#94b77b" />
          <path d="M11 5h10v3h4v5h-8v-3H8V8h3z" fill="#b2cc93" />
        </symbol>
      </defs>
      <rect x="-2000" y="-2000" width="5000" height="5000" fill="#f5eee0" />
      <g clipPath={`url(#${prefix}-extent)`}>
        <rect x={left} y="0" width={right - left} height="800" fill="#e4ddc7" />
        {(["water", "park", "building", "road"] as const).map((kind) => (
          <g key={kind}>
            {geography.features
              .filter((f) => f.kind === kind)
              .map((feature) => {
                const foot = ["footway", "path", "steps", "cycleway"].includes(
                  feature.roadClass ?? "",
                );
                const major = ["primary", "secondary", "trunk"].includes(
                  feature.roadClass ?? "",
                );
                const index =
                  Array.from(feature.id).reduce(
                    (sum, c) => sum + c.charCodeAt(0),
                    0,
                  ) % 4;
                return (
                  <path
                    key={feature.id}
                    d={featurePath(feature, geography.bounds)}
                    fill={
                      kind === "building"
                        ? ["#d3b99e", "#d9c4a9", "#cdb8a3", "#d5b79f"][index]
                        : fills[kind]
                    }
                    fillRule="evenodd"
                    stroke={
                      kind === "road"
                        ? foot
                          ? "#dfcfab"
                          : "#f5e8cc"
                        : kind === "building" && !feature.outlines?.length
                          ? "#b8a58e"
                          : "none"
                    }
                    strokeWidth={
                      kind === "road" ? (major ? 11 : foot ? 2.5 : 6) : 1.2
                    }
                    strokeLinejoin="round"
                  />
                );
              })}
          </g>
        ))}
        <g fill="none" strokeWidth="3" strokeLinejoin="round">
          {geography.features
            .filter((f) => f.outlines?.length)
            .map((f) => (
              <path
                key={f.id}
                strokeWidth={f.kind === "building" ? 1.2 : 2}
                d={featurePath(
                  { ...f, kind: "road", rings: f.outlines! },
                  geography.bounds,
                )}
                stroke={
                  f.kind === "water"
                    ? "#91bacd"
                    : f.kind === "park"
                      ? "#9fbd8b"
                      : "#b8a58e"
                }
              />
            ))}
        </g>
        <g fill="#676b59" fontSize="12" textAnchor="middle" aria-hidden="true">
          {geography.features
            .filter(
              (f) =>
                f.name && ["water", "park"].includes(f.kind) && f.rings[0]?.[0],
            )
            .slice(0, 4)
            .map((f) => {
              const [x, y] = project(f.rings[0][0], geography.bounds);
              return (
                <text key={f.id} x={x} y={y - 6}>
                  {f.name}
                </text>
              );
            })}
        </g>
        <g aria-hidden="true">
          {parkDecorations(geography).map(([x, y]) => (
            <use
              key={`${x}-${y}`}
              href={`#${prefix}-tree`}
              x={x - 16}
              y={y - 20}
              width="32"
              height="40"
            />
          ))}
        </g>
      </g>
    </>
  );
});
