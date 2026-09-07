"use client";
import { useRef, useState } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import {
  project,
  constrainCamera,
  initialCamera,
  type Geography,
} from "@/lib/map/model";
import { PixelGeography } from "@/components/map/pixel-geography";

export function MapCanvas({ geography }: { geography: Geography }) {
  const { t } = useI18n();
  const [left] = project(
    [geography.bounds[0], geography.bounds[1]],
    geography.bounds,
  );
  const [right] = project(
    [geography.bounds[2], geography.bounds[3]],
    geography.bounds,
  );
  const [camera, setCamera] = useState(initialCamera);
  const drag = useRef<{ id: number; x: number; y: number } | null>(null);
  const zoom = (step: number) =>
    setCamera((c) => constrainCamera({ ...c, zoom: c.zoom + step }));
  return (
    <div className="map-canvas">
      <svg
        className="map-svg"
        viewBox={`${left} 0 ${right - left} 800`}
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label={t("map.canvas")}
        aria-describedby="map-keyboard-help"
        tabIndex={0}
        onKeyDown={(event) => {
          const deltas: Record<string, [number, number]> = {
            ArrowLeft: [60, 0],
            ArrowRight: [-60, 0],
            ArrowUp: [0, 60],
            ArrowDown: [0, -60],
          };
          if (deltas[event.key]) {
            event.preventDefault();
            const [x, y] = deltas[event.key];
            setCamera((c) => constrainCamera({ ...c, x: c.x + x, y: c.y + y }));
          } else if (["+", "=", "-"].includes(event.key)) {
            event.preventDefault();
            zoom(event.key === "-" ? -0.25 : 0.25);
          } else if (event.key === "Home") {
            event.preventDefault();
            setCamera(initialCamera);
          }
        }}
        onPointerDown={(event) => {
          if (!event.isPrimary) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
          };
        }}
        onPointerMove={(event) => {
          const previous = drag.current;
          if (!previous || previous.id !== event.pointerId) return;
          const box = event.currentTarget.getBoundingClientRect();
          const scale = Math.max(box.width / (right - left), box.height / 800);
          setCamera((c) =>
            constrainCamera({
              ...c,
              x: c.x + (event.clientX - previous.x) / scale,
              y: c.y + (event.clientY - previous.y) / scale,
            }),
          );
          drag.current = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
          };
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
        onLostPointerCapture={() => {
          drag.current = null;
        }}
      >
        <g
          transform={`translate(${camera.x + 500} ${camera.y + 400}) scale(${camera.zoom}) translate(-500 -400)`}
        >
          <PixelGeography geography={geography} />
        </g>
      </svg>
      <p className="sr-only" id="map-keyboard-help">
        {t("map.keyboard")}
      </p>
      <div className="map-controls" role="group" aria-label={t("map.controls")}>
        <button
          type="button"
          aria-label={t("map.zoomIn")}
          onClick={() => zoom(0.25)}
          disabled={camera.zoom >= 3}
        >
          +
        </button>
        <button
          type="button"
          aria-label={t("map.zoomOut")}
          onClick={() => zoom(-0.25)}
          disabled={camera.zoom <= 1}
        >
          −
        </button>
        <button
          type="button"
          aria-label={t("map.recenter")}
          onClick={() => setCamera(initialCamera)}
        >
          ⌖
        </button>
      </div>
      <a
        className="map-attribution"
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noreferrer"
      >
        © OpenStreetMap contributors · ODbL
      </a>
    </div>
  );
}
