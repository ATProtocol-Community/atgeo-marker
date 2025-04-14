import { useState, useRef, useCallback, useMemo } from "react";
import {
  Map as MapLibreMap,
  Source,
  Layer,
  NavigationControl,
  FullscreenControl,
  ScaleControl,
  GeolocateControl,
  ViewState,
  MapRef,
  MapLayerMouseEvent,
} from "react-map-gl/maplibre";
// Import specific layer types for better type checking
import type {
  GeoJSONSource,
  CircleLayerSpecification,
  SymbolLayerSpecification,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import STOPS from "../../../king_county_transit.json";

// --- Layer Definitions ---

// Cluster Circles Layer
export const clusterLayer: CircleLayerSpecification = {
  id: "clusters",
  type: "circle",
  source: "stops",
  filter: ["has", "point_count"],
  paint: {
    "circle-color": [
      "step",
      ["get", "point_count"],
      "#51bbd6",
      100,
      "#f1f075",
      750,
      "#f28cb1",
    ],
    "circle-stroke-color": "#fff",
    "circle-stroke-width": 1,
    "circle-radius": ["step", ["get", "point_count"], 20, 100, 30, 750, 40],
  },
};

// Cluster Count Layer
const clusterCountLayer: SymbolLayerSpecification = {
  id: "cluster-count",
  type: "symbol",
  source: "stops",
  filter: ["has", "point_count"],
  layout: {
    "text-field": "{point_count_abbreviated}",
    "text-font": ["Noto Sans Bold"],
    "text-size": 12,
    "text-allow-overlap": true,
    "text-ignore-placement": true,
  },
  paint: {
    "text-color": "#000000", // Black text
  },
};

// Unclustered Points Layer (Keep definition but comment out usage below)
const unclusteredPointLayer: CircleLayerSpecification = {
  id: "unclustered-point",
  type: "circle",
  source: "stops",
  filter: ["!", ["has", "point_count"]],
  paint: {
    "circle-color": "#11b4da",
    "circle-radius": 6,
    "circle-stroke-width": 1,
    "circle-stroke-color": "#fff",
  },
};

// --- Component ---

interface MapProps {
  animateIn?: boolean;
}

export default function Map({ animateIn = true }: MapProps) {
  const [viewState, setViewState] = useState<ViewState>({
    latitude: 47.620422,
    longitude: -122.349358,
    zoom: 10,
    bearing: 0,
    pitch: 0,
    padding: { bottom: 0, top: 128, left: 0, right: 0 },
  });

  const isAnimating = useRef(animateIn);
  const mapRef = useRef<MapRef | null>(null);

  // TODO: find the lib this comes from
  const stopsGeoJson = useMemo((): any => {
    // (GeoJSON conversion logic remains the same)
    return {
      type: "FeatureCollection",
      features: STOPS.map((stop) => ({
        type: "Feature",
        properties: { stopId: stop.stop_id, stopName: stop.stop_name },
        geometry: {
          type: "Point",
          coordinates: [stop.stop_lon, stop.stop_lat],
        },
      })),
    };
  }, []);

  const onMapLoad = useCallback(() => {
    // (Animation logic remains the same)
    if (animateIn && mapRef.current) {
      isAnimating.current = true;
      mapRef.current.flyTo({
        center: [viewState.longitude, viewState.latitude],
        zoom: 16,
        bearing: 120,
        pitch: 80,
        duration: 6000,
      });
      isAnimating.current = false;
    } else {
      isAnimating.current = false;
    }
    console.log("Map loaded, source and layers should be added.");
  }, [animateIn, viewState.longitude, viewState.latitude]);

  const onClick = useCallback((event: MapLayerMouseEvent) => {
    // (Click logic remains the same, only checks cluster layer)
    const map = mapRef.current;
    if (!map || event.defaultPrevented) return;

    const features = map.queryRenderedFeatures(event.point, {
      layers: [clusterLayer.id],
    });

    if (features.length > 0) {
      event.preventDefault();
      console.log("Cluster clicked!");
      const cluster = features[0];
      const clusterId = cluster.properties?.cluster_id;
      // coordinates should exist?
      const [longitude, latitude] = (cluster.geometry as any).coordinates;
      const source = map.getSource("stops") as GeoJSONSource | undefined;

      if (!source?.getClusterExpansionZoom) {
        console.error("Could not get source or getClusterExpansionZoom method");
        return;
      }

      source.getClusterExpansionZoom(clusterId).then((zoom) => {
        isAnimating.current = true;
        mapRef.current?.flyTo({
          center: [longitude, latitude],
          zoom: zoom,
          duration: 600,
        });
        isAnimating.current = false;
      });
    }
  }, []);

  const interactiveLayerIds = useMemo(() => [clusterLayer.id], []);

  return (
    <MapLibreMap
      ref={mapRef}
      {...viewState}
      onMove={(evt) => {
        if (!isAnimating.current) setViewState(evt.viewState);
      }}
      onMoveEnd={(evt) => {
        if (isAnimating.current) isAnimating.current = false;
        setViewState(evt.viewState);
      }}
      onLoad={onMapLoad}
      mapStyle="https://tiles.openfreemap.org/styles/liberty"
      interactiveLayerIds={interactiveLayerIds}
      onClick={onClick}
    >
      <GeolocateControl style={{ marginTop: "5rem" }} position="top-left" />
      <FullscreenControl position="top-left" />
      <NavigationControl position="top-left" />
      <ScaleControl />

      <Source
        id="stops"
        type="geojson"
        data={stopsGeoJson}
        cluster={true}
        clusterMaxZoom={16}
        clusterRadius={50}
      >
        <Layer {...clusterLayer} beforeId={clusterCountLayer.id} />

        <Layer {...clusterCountLayer} />

        <Layer {...unclusteredPointLayer} beforeId={clusterLayer.id} />
      </Source>
    </MapLibreMap>
  );
}
