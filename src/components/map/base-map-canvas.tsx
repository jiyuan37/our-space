"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";
import { useI18n } from "@/components/i18n/i18n-provider";
import { OpenFreeMapProvider, boundsCenter } from "@/lib/map/base-map-provider";
import type { Bounds } from "@/lib/map/model";
import type { Geography } from "@/lib/map/model";

export type BaseMapLoadState = "loading" | "ready" | "error";

export function BaseMapCanvas({
  bounds,
  enrichment,
  onStateChange,
}: Readonly<{
  bounds: Bounds;
  enrichment?: Geography | null;
  onStateChange: (state: BaseMapLoadState) => void;
}>) {
  const { t } = useI18n();
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const [styleReady, setStyleReady] = useState(false);

  useEffect(() => {
    if (!container.current) return;
    setStyleReady(false);
    const definition = new OpenFreeMapProvider().definition();
    onStateChange("loading");
    const instance = new maplibregl.Map({
      container: container.current,
      style: definition.style,
      center: boundsCenter(bounds),
      zoom: 14,
      minZoom: 3,
      maxZoom: 18,
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      fadeDuration: 0,
    });
    map.current = instance;
    instance.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right",
    );
    instance.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-right",
    );
    const loaded = () => {
      setStyleReady(true);
      onStateChange("ready");
    };
    const failed = () => onStateChange("error");
    instance.once("load", loaded);
    instance.on("error", failed);
    const observer = new ResizeObserver(() => instance.resize());
    observer.observe(container.current);
    return () => {
      observer.disconnect();
      instance.off("error", failed);
      instance.remove();
      map.current = null;
    };
  }, [bounds, onStateChange]);

  useEffect(() => {
    const instance = map.current;
    if (!instance || !enrichment || !styleReady) return;
    const data: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: enrichment.features.flatMap((feature) =>
        feature.rings.map(
          (coordinates, index): GeoJSON.Feature => ({
            type: "Feature",
            id: `${feature.id}-${index}`,
            properties: { kind: feature.kind },
            geometry:
              feature.kind === "road"
                ? {
                    type: "LineString",
                    coordinates: coordinates.map((p) => [...p]),
                  }
                : {
                    type: "Polygon",
                    coordinates: [coordinates.map((p) => [...p])],
                  },
          }),
        ),
      ),
    };
    if (instance.getSource("overpass-enrichment")) {
      (
        instance.getSource("overpass-enrichment") as maplibregl.GeoJSONSource
      ).setData(data);
      return;
    }
    instance.addSource("overpass-enrichment", { type: "geojson", data });
    instance.addLayer({
      id: "overpass-enrichment-lines",
      type: "line",
      source: "overpass-enrichment",
      paint: {
        "line-color": "#80664f",
        "line-width": 1.5,
        "line-opacity": 0.45,
      },
    });
  }, [enrichment, styleReady]);

  return (
    <div
      ref={container}
      className="base-map-canvas"
      role="region"
      aria-label={t("map.canvas")}
      data-provider="openfreemap"
      data-enrichment={enrichment ? "ready" : "none"}
    />
  );
}
