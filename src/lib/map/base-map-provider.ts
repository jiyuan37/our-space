import type { StyleSpecification } from "maplibre-gl";
import type { Bounds } from "./model";

export type BaseMapDefinition = Readonly<{
  id: string;
  style: StyleSpecification;
  attribution: ReadonlyArray<Readonly<{ label: string; url: string }>>;
}>;

export interface BaseMapProvider {
  definition(): BaseMapDefinition;
}

const openFreeMapSource = "openfreemap";

// OpenFreeMap 提供 OpenMapTiles schema 的 vector TileJSON；颜色、层级和取舍由 Our Space 控制。
export class OpenFreeMapProvider implements BaseMapProvider {
  definition(): BaseMapDefinition {
    return {
      id: "openfreemap",
      attribution: [
        { label: "OpenFreeMap", url: "https://openfreemap.org" },
        {
          label: "OpenStreetMap contributors",
          url: "https://www.openstreetmap.org/copyright",
        },
      ],
      style: {
        version: 8,
        sources: {
          [openFreeMapSource]: {
            type: "vector",
            url: "https://tiles.openfreemap.org/planet",
            attribution:
              '<a href="https://openfreemap.org">OpenFreeMap</a> · © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
          },
        },
        layers: [
          {
            id: "home-ground",
            type: "background",
            paint: { "background-color": "#e8dcc4" },
          },
          {
            id: "home-water",
            type: "fill",
            source: openFreeMapSource,
            "source-layer": "water",
            paint: { "fill-color": "#a9cddd", "fill-opacity": 0.92 },
          },
          {
            id: "home-green",
            type: "fill",
            source: openFreeMapSource,
            "source-layer": "landuse",
            filter: [
              "in",
              ["get", "class"],
              ["literal", ["park", "grass", "wood", "cemetery"]],
            ],
            paint: { "fill-color": "#b7ce9e", "fill-opacity": 0.88 },
          },
          {
            id: "home-buildings",
            type: "fill",
            source: openFreeMapSource,
            "source-layer": "building",
            minzoom: 13,
            paint: {
              "fill-color": "#d9b08c",
              "fill-outline-color": "#9e725e",
              "fill-opacity": 0.86,
            },
          },
          {
            id: "home-roads-casing",
            type: "line",
            source: openFreeMapSource,
            "source-layer": "transportation",
            paint: {
              "line-color": "#ad9a7b",
              "line-width": [
                "interpolate",
                ["linear"],
                ["zoom"],
                10,
                1.2,
                16,
                8,
              ],
            },
          },
          {
            id: "home-roads",
            type: "line",
            source: openFreeMapSource,
            "source-layer": "transportation",
            paint: {
              "line-color": "#ead7ae",
              "line-width": [
                "interpolate",
                ["linear"],
                ["zoom"],
                10,
                0.7,
                16,
                5,
              ],
            },
          },
        ],
      },
    };
  }
}

export function boundsCenter(bounds: Bounds): [number, number] {
  return [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2];
}
