"use client";

import { useCallback, useEffect, useState } from "react";
import { BaseMapCanvas, type BaseMapLoadState } from "./base-map-canvas";
import { useI18n } from "@/components/i18n/i18n-provider";
import { MAP_AREAS, findMapArea, type MapAreaId } from "@/lib/map/areas";
import type { Geography } from "@/lib/map/model";

const defaultArea: MapAreaId = "paris-seine";

export function MapBrowser({ spaceId }: { spaceId: string }) {
  const { locale, t } = useI18n();
  const storageKey = `our-space-map-view:${spaceId}`;
  const [chosen, setChosen] = useState<MapAreaId>(defaultArea);
  const [baseState, setBaseState] = useState<BaseMapLoadState>("loading");
  const [enrichment, setEnrichment] = useState<Geography | null>(null);
  const [enrichmentState, setEnrichmentState] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const area = findMapArea(chosen) ?? MAP_AREAS[1];

  useEffect(() => {
    try {
      const saved = findMapArea(localStorage.getItem(storageKey));
      if (saved) setChosen(saved.id);
    } catch {
      // 本地偏好不可用不阻断底图或 Home。
    }
  }, [storageKey]);

  const changeArea = (id: MapAreaId) => {
    setChosen(id);
    setEnrichment(null);
    setEnrichmentState("idle");
    try {
      localStorage.setItem(storageKey, id);
    } catch {}
  };

  const loadEnrichment = async () => {
    setEnrichmentState("loading");
    try {
      const response = await fetch(
        `/api/map?area=${encodeURIComponent(chosen)}`,
        {
          credentials: "same-origin",
          cache: "no-store",
        },
      );
      if (!response.ok) throw new Error("MAP_ENRICHMENT_UNAVAILABLE");
      setEnrichment((await response.json()) as Geography);
      setEnrichmentState("ready");
    } catch {
      setEnrichmentState("error");
    }
  };

  const handleBaseState = useCallback((state: BaseMapLoadState) => {
    setBaseState(state);
  }, []);

  return (
    <>
      <div
        className="map-stage"
        data-enrichment={enrichment ? "ready" : "none"}
      >
        <BaseMapCanvas
          bounds={area.bounds}
          enrichment={enrichment}
          onStateChange={handleBaseState}
        />
        <div className="map-base-status" role="status" aria-live="polite">
          {baseState === "loading" && <p>{t("map.loading")}</p>}
          {baseState === "error" && <p>{t("map.baseError")}</p>}
        </div>
      </div>
      <div className="map-region">
        <details>
          <summary>{locale === "zh-CN" ? area.zh : area.en}</summary>
          <div className="map-area-picker">
            <p>{t("map.areaNote")}</p>
            {MAP_AREAS.map((candidate) => (
              <button
                type="button"
                key={candidate.id}
                aria-pressed={chosen === candidate.id}
                onClick={() => changeArea(candidate.id)}
              >
                {locale === "zh-CN" ? candidate.zh : candidate.en}
              </button>
            ))}
            <button
              type="button"
              disabled={enrichmentState === "loading"}
              onClick={() => void loadEnrichment()}
            >
              {enrichmentState === "loading"
                ? t("map.enrichmentLoading")
                : t("map.enrichmentLoad")}
            </button>
            {enrichmentState === "ready" && <p>{t("map.enrichmentReady")}</p>}
            {enrichmentState === "error" && <p>{t("map.enrichmentError")}</p>}
          </div>
        </details>
      </div>
    </>
  );
}
