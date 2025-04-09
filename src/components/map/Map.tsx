import { useState, useMemo, useEffect, useRef } from "react";
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
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

export default function Map() {
  const [viewState, setViewState] = useState<ViewState>({
    latitude: 47.620422,
    longitude: -122.349358,
    zoom: 16,
    bearing: 0,
    pitch: 60,
    padding: { bottom: 0, top: 0, left: 0, right: 0 },
  });

  // current animation frame
  const animationFrameRef = useRef<number | null>(null);
  // last frame's timestamp
  const previousTimeRef = useRef<number | null>(null);
  const frameCount = useRef<number>(1);

  const isAnimating = useRef(true);

  useEffect(() => {
    const animateBearing = (currentTime: number) => {
      if (!isAnimating.current) return;
      if (previousTimeRef.current === null) {
        previousTimeRef.current = currentTime;
      }

      // calculate deltaTime (change in time since last frame)
      const deltaTime = currentTime - previousTimeRef.current;
      const degreesPerSecond = Math.min(
        5,
        Math.max((frameCount.current / 500) ** -1.0 - 1, 0),
      );

      setViewState((prevState) => ({
        ...prevState,
        // update based on deltaTime
        bearing:
          (prevState.bearing + (degreesPerSecond * deltaTime) / 100) % 360,
      }));

      // set time info for next frame
      previousTimeRef.current = currentTime;
      animationFrameRef.current = requestAnimationFrame(animateBearing);
      frameCount.current += 1;
    };

    animationFrameRef.current = requestAnimationFrame(animateBearing);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      previousTimeRef.current = null;
    };
  }, []);

  return (
    <MapLibreMap
      {...viewState}
      onMove={(evt) => {
        setViewState(evt.viewState);
        isAnimating.current = false;
      }}
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
    </MapLibreMap>
  );
}
