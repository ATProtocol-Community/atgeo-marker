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
  Popup,
} from "react-map-gl/maplibre";

import type {
  GeoJSONSource,
  CircleLayerSpecification,
  SymbolLayerSpecification,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { useTheme } from "~/lib/ThemeProvider";

// Define the Geomarker type based on the lexicon (specifically the geo location part)
interface GeoLocation {
  $type: "community.lexicon.location.geo";
  name?: string;
  latitude: string;
  longitude: string;
  altitude?: string;
}

interface Geomarker {
  label: string;
  location: GeoLocation; // Assuming only GeoLocation for now
  markedEntries?: string[];
}

// Define properties for GeoJSON features derived from Geomarkers
interface GeomarkerFeatureProperties {
  markerLabel: string;
  // Add other properties from Geomarker if needed later
}

export const clusterLayer: CircleLayerSpecification = {
  id: "clusters",
  type: "circle",
  source: "markers", // Renamed source ID
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

const clusterCountLayer: SymbolLayerSpecification = {
  id: "cluster-count",
  type: "symbol",
  source: "markers", // Renamed source ID
  filter: ["has", "point_count"],
  layout: {
    "text-field": "{point_count_abbreviated}",
    "text-font": ["Noto Sans Bold"],
    "text-size": 12,
    "text-allow-overlap": true,
    "text-ignore-placement": true,
  },
  paint: {
    "text-color": "#000000",
  },
};

const unclusteredPointLayer: CircleLayerSpecification = {
  id: "unclustered-point",
  type: "circle",
  source: "markers", // Renamed source ID
  filter: ["!", ["has", "point_count"]],
  paint: {
    "circle-color": "#11b4da",
    "circle-radius": 6,
    "circle-stroke-width": 1,
    "circle-stroke-color": "#fff",
  },
};

interface PopupInfo {
  longitude: number;
  latitude: number;
  label: string;
}

interface MapProps {
  geomarkers: Geomarker[]; // Accept Geomarkers as a prop
  animateIn?: boolean;
}

export default function Map({ geomarkers, animateIn = true }: MapProps) {
  const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null);

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

  const theme = useTheme();

  // Use the geomarkers prop to create GeoJSON
  // find out what package this is from :sob:
  const markersGeoJson = useMemo((): any => {
    return {
      type: "FeatureCollection",
      features: geomarkers
        // Filter out any markers that don't have the expected geo location
        .filter(
          (marker) =>
            marker.location?.$type === "community.lexicon.location.geo",
        )
        .map((marker): any => ({
          type: "Feature",
          properties: { markerLabel: marker.label }, // Use marker.label
          geometry: {
            type: "Point",
            // Parse lat/lon strings to numbers for GeoJSON coordinates
            coordinates: [
              parseFloat(marker.location.longitude),
              parseFloat(marker.location.latitude),
            ],
          },
        })),
    };
  }, [geomarkers]); // Depend on the geomarkers prop

  const onMapLoad = useCallback(() => {
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
    const map = mapRef.current;
    if (!map || event.defaultPrevented) return;

    const features = map.queryRenderedFeatures(event.point, {
      layers: [clusterLayer.id, unclusteredPointLayer.id],
    });

    console.log(features);

    // get features.unclusteredPoints
    const unclusteredPoints = features.filter(
      (feature) => feature.layer.id === unclusteredPointLayer.id,
    );

    // get features.clusteredPoints
    const clusteredPoints = features.filter(
      (feature) => feature.layer.id === clusterLayer.id,
    );

    if (clusteredPoints.length > 0) {
      event.preventDefault();
      console.log("Cluster clicked!");
      const cluster = clusteredPoints[0];
      const clusterId = cluster.properties?.cluster_id;
      // Ensure geometry is Point before accessing coordinates
      if (cluster.geometry?.type !== "Point") {
        console.error(
          "Clicked cluster feature geometry is not a Point:",
          cluster.geometry,
        );
        return;
      }
      const [longitude, latitude] = cluster.geometry.coordinates;
      const source = map.getSource("markers") as GeoJSONSource | undefined; // Use renamed source ID

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
    } else if (features.length > 0) {
      event.preventDefault();
      const point = features[0];
      if (!point.geometry || point.geometry.type !== "Point") {
        console.error(
          "Clicked feature geometry is not a Point:",
          point.geometry,
        );
        return;
      }
      const [longitude, latitude] = point.geometry.coordinates;
      const label = point.properties?.markerLabel ?? "No label"; // Get label from properties

      console.log("Marker clicked:", label);
      setPopupInfo({ longitude, latitude, label }); // Set popup info
    } else {
      event.preventDefault();
      console.log("No features clicked");
      setPopupInfo(null); // Clear popup info
    }
  }, []);

  const interactiveLayerIds = useMemo(
    () => [clusterLayer.id, unclusteredPointLayer.id],
    [],
  );

  const mapStyle = useMemo(() => {
    return theme.theme === "dark"
      ? "https://gist.githubusercontent.com/espeon/de168da3748c9462e1186203c78221a3/raw/8b1e888003839c2c4dbbd14de3213f31f1ea0643/darkmode.json"
      : "https://tiles.openfreemap.org/styles/liberty";
  }, [theme.theme]);

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
      mapStyle={mapStyle}
      interactiveLayerIds={interactiveLayerIds}
      onClick={onClick}
    >
      <GeolocateControl style={{ marginTop: "5rem" }} position="top-left" />
      <FullscreenControl position="top-left" />
      <NavigationControl position="top-left" />
      <ScaleControl />

      {/* Update Source to use the new GeoJSON data and ID */}
      <Source
        id="markers" // Renamed source ID
        type="geojson"
        data={markersGeoJson} // Use the new GeoJSON derived from props
        cluster={true}
        clusterMaxZoom={16} // Kept existing cluster settings
        clusterRadius={50} // Kept existing cluster settings
      >
        {/* Layers now reference the renamed source ID 'markers' */}
        <Layer {...clusterLayer} beforeId={clusterCountLayer.id} />
        <Layer {...clusterCountLayer} />
        <Layer {...unclusteredPointLayer} beforeId={clusterLayer.id} />
      </Source>

      {popupInfo && (
        <Popup
          longitude={popupInfo.longitude}
          latitude={popupInfo.latitude}
          anchor="bottom"
          onClose={() => setPopupInfo(null)} // Allow closing the popup
          closeButton={true}
          closeOnClick={false} // Keep popup open when map is clicked elsewhere
          className="text-gray-800"
        >
          {/* Render the content here. For now, just the label. */}
          {popupInfo.label}
          {/* You can replace the line above with a component rendering the post */}
          {/* e.g., <PostComponent markerLabel={popupInfo.label} /> */}
        </Popup>
      )}
    </MapLibreMap>
  );
}
