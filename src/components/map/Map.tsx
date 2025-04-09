import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { createRoot } from "react-dom/client";
import {
  Map as MapLibreMap,
  Marker,
  Popup,
  NavigationControl,
  FullscreenControl,
  ScaleControl,
  GeolocateControl,
  ViewState,
  MapRef,
} from "react-map-gl/maplibre";
import useSupercluster from "use-supercluster";
import "maplibre-gl/dist/maplibre-gl.css";

import STOPS from "../../../king_county_transit.json";
import { Pin } from "lucide-react";

interface MapProps {
  animateIn?: boolean;
}

interface PointFeature {
  type: "Feature";
  properties: {
    cluster: boolean;
    stopId: string | number;
  };
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
}

export default function Map({ animateIn = true }: MapProps) {
  const [viewState, setViewState] = useState<ViewState>({
    latitude: 47.620422,
    longitude: -122.349358,
    zoom: 10,
    bearing: 0,
    pitch: 0,
    // keep into account the header
    padding: { bottom: 0, top: 128, left: 0, right: 0 },
  });

  const isAnimating = useRef(animateIn);
  const mapRef = useRef<MapRef | null>(null);
  const [bounds, setBounds] = useState<number[] | undefined>(undefined);

  const points = useMemo(() => {
    return STOPS.map(
      (stop): PointFeature => ({
        type: "Feature",
        properties: {
          cluster: false,
          stopId: stop.stop_id,
        },
        geometry: {
          type: "Point",
          coordinates: [stop.stop_lon, stop.stop_lat],
        },
      }),
    );
  }, [STOPS]);

  const { clusters, supercluster } = useSupercluster({
    points: points,
    bounds: bounds ? [bounds[0], bounds[1], bounds[2], bounds[3]] : undefined,
    zoom: viewState.zoom,
    options: { radius: 180, maxZoom: 17 },
  });

  const updateBounds = () => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      setBounds(map.getBounds().toArray().flat());
    }
  };

  const onMapLoad = useCallback(() => {
    updateBounds();

    // animation, but only if needed
    if (animateIn && mapRef.current) {
      mapRef.current.flyTo({
        center: [viewState.longitude, viewState.latitude],
        zoom: 16,
        bearing: 120,
        pitch: 80,
        duration: 6000,
      });
    }
  }, [animateIn, viewState.longitude, viewState.latitude, updateBounds]);

  return (
    <MapLibreMap
      ref={mapRef}
      {...viewState}
      onMove={(evt) => {
        setViewState(evt.viewState);
        isAnimating.current = false;
        updateBounds();
      }}
      onLoad={onMapLoad}
      mapStyle="https://gist.githubusercontent.com/espeon/de168da3748c9462e1186203c78221a3/raw/8b1e888003839c2c4dbbd14de3213f31f1ea0643/darkmode.json"
    >
      <GeolocateControl
        style={{
          // move down b/c header
          marginTop: "5rem",
        }}
        position="top-left"
      />
      <FullscreenControl position="top-left" />
      <NavigationControl position="top-left" />
      <ScaleControl />
      {clusters.map((cluster) => {
        const [longitude, latitude] = cluster.geometry.coordinates;
        const { cluster: isCluster, point_count: pointCount } =
          cluster.properties as any;

        if (isCluster) {
          return (
            <Marker
              key={`cluster-${cluster.id}`}
              latitude={latitude}
              longitude={longitude}
            >
              <div
                className="bg-primary-foreground flex items-center justify-center rounded-full border"
                style={{
                  width: `${20 + (pointCount / points.length) * 30}px`,
                  height: `${20 + (pointCount / points.length) * 30}px`,
                  fontSize: `${11 + (pointCount / points.length) * 10}px`,
                }}
                onClick={() => {
                  if (!supercluster) return;
                  const expansionZoom = Math.min(
                    supercluster.getClusterExpansionZoom(cluster.id as number),
                    20, // the max zoom level
                  );
                  // fly to location
                  if (mapRef.current) {
                    mapRef.current.flyTo({
                      center: [longitude, latitude],
                      zoom: expansionZoom,
                      speed: 1.5,
                    });
                  } else {
                    // fallback if we can't get the ref
                    setViewState({
                      ...viewState,
                      longitude,
                      latitude,
                      zoom: expansionZoom,
                    });
                  }
                }}
              >
                {pointCount}
              </div>
            </Marker>
          );
        }

        return (
          <Marker
            key={`stop-${cluster.properties.stopId}`}
            longitude={longitude}
            latitude={latitude}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              // Handle individual marker click here if needed
            }}
          >
            <Pin className="fill-background/50" />
          </Marker>
        );
      })}
    </MapLibreMap>
  );
}
