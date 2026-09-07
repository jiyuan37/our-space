"use client";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { MAP_AREAS, findMapArea, type MapAreaId } from "@/lib/map/areas";
import type { Geography } from "@/lib/map/model";
import { MapCanvas } from "./map-canvas";

export function MapBrowser({ spaceId }: { spaceId: string }) {
  const { locale, t } = useI18n();
  const [ready, setReady] = useState(false);
  const [chosen, setChosen] = useState<MapAreaId | null>(null);
  const [geography, setGeography] = useState<Geography | null>(null);
  const [loading, setLoading] = useState(false);
  const [notConfigured, setNotConfigured] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const lastLoaded = useRef<MapAreaId | null>(null);
  const storageKey = `our-space-map-view:${spaceId}`;
  useEffect(() => {
    try {
      const saved = findMapArea(localStorage.getItem(storageKey));
      if (saved) setChosen(saved.id);
    } catch {
      /* 拒绝本地存储不阻断 Home。 */
    } finally {
      setReady(true);
    }
  }, [storageKey]);
  useEffect(() => {
    if (!chosen) return;
    const controller = new AbortController();
    setLoading(true);
    setFailed(false);
    setNotConfigured(false);
    void fetch(`/api/map?area=${encodeURIComponent(chosen)}`, {
      credentials: "same-origin",
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) {
          const body = await response.json();
          if (
            !controller.signal.aborted &&
            body.errorCode === "MAP_NOT_CONFIGURED"
          )
            setNotConfigured(true);
          throw new Error("MAP_UNAVAILABLE");
        }
        return response.json() as Promise<Geography>;
      })
      .then((data) => {
        if (controller.signal.aborted) return;
        setGeography(data);
        lastLoaded.current = chosen;
        try {
          localStorage.setItem(storageKey, chosen);
        } catch {}
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [chosen, attempt, storageKey]);
  return (
    <>
      {geography && (
        <MapCanvas key={lastLoaded.current} geography={geography} />
      )}
      <div className="map-region">
        <details open={!chosen}>
          <summary>
            {chosen
              ? locale === "zh-CN"
                ? findMapArea(chosen)?.zh
                : findMapArea(chosen)?.en
              : t("map.chooseArea")}
          </summary>
          <div className="map-area-picker">
            <p>{t("map.areaNote")}</p>
            {MAP_AREAS.map((area) => (
              <button
                type="button"
                key={area.id}
                aria-pressed={chosen === area.id}
                disabled={!ready || loading}
                onClick={(event) => {
                  setGeography(null);
                  setChosen(area.id);
                  event.currentTarget
                    .closest("details")
                    ?.removeAttribute("open");
                }}
              >
                {locale === "zh-CN" ? area.zh : area.en}
              </button>
            ))}
          </div>
        </details>
        <div role="status">
          {loading ? (
            t("map.loading")
          ) : failed ? (
            <>
              <p>{t(notConfigured ? "map.notConfigured" : "map.error")}</p>
              {!notConfigured && (
                <button type="button" onClick={() => setAttempt((n) => n + 1)}>
                  {t("map.retry")}
                </button>
              )}
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
