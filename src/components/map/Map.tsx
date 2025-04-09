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

interface MapProps {
  animateIn?: boolean;
}

export default function Map({ animateIn = true }: MapProps) {
  const [viewState, setViewState] = useState<ViewState>({
    latitude: 47.620422,
    longitude: -122.349358,
    zoom: 16,
    bearing: 0,
    pitch: 60,
    // keeping into account the header
    padding: { bottom: 0, top: 128, left: 0, right: 0 },
  });

  const isAnimating = useRef(animateIn);

  useEffect(() => {
    // current animation frame
    let animationFrameRef: number | null = null;
    // last frame's timestamp
    let previousTimeRef: number | null = null;
    let frameCount = 1;
    const animateBearing = (currentTime: number) => {
      if (!isAnimating.current) return;
      if (previousTimeRef === null) {
        previousTimeRef = currentTime;
      }

      // calculate deltaTime (change in time since last frame)
      const deltaTime = currentTime - previousTimeRef;
      const degreesPerSecond = Math.min(
        5,
        Math.max((frameCount / 500) ** -1.0 - 1, 0),
      );

      // intro anim is finished, no need for more processing
      if (degreesPerSecond === 0) {
        isAnimating.current = false;
        return;
      }

      setViewState((prevState) => ({
        ...prevState,
        // update based on deltaTime
        bearing:
          (prevState.bearing + (degreesPerSecond * deltaTime) / 100) % 360,
      }));

      // set time info for next frame
      previousTimeRef = currentTime;
      animationFrameRef = requestAnimationFrame(animateBearing);
      frameCount += 1;
    };

    console.log("Starting anim");
    animationFrameRef = requestAnimationFrame(animateBearing);

    return () => {
      if (animationFrameRef !== null) {
        cancelAnimationFrame(animationFrameRef);
      }
      previousTimeRef = null;
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
