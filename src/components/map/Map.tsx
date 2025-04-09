import { useState, useMemo } from "react";
import { createRoot } from "react-dom/client";
import {
  Map as MapLibreMap,
  Marker,
  Popup,
  NavigationControl,
  FullscreenControl,
  ScaleControl,
  GeolocateControl,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

export default function Map() {
  return (
    <MapLibreMap
      initialViewState={{
        latitude: 40,
        longitude: -100,
        zoom: 3.5,
        bearing: 0,
        pitch: 0,
      }}
      mapStyle="https://tiles.openfreemap.org/styles/liberty"
    >
      <GeolocateControl
        style={{
          // keeping the header into account
          marginTop: "5rem",
        }}
        position="top-left"
      />
      <FullscreenControl position="top-left" />
      <NavigationControl position="top-left" />
      <ScaleControl />
    </MapLibreMap>
  );
}
