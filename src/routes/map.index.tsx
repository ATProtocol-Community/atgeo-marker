import { createFileRoute } from "@tanstack/react-router";
import Map from "~/components/map/Map";

import exampleData from "~/geomarkers.json";

export const Route = createFileRoute("/map/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <Map geomarkers={exampleData as any} />
    </div>
  );
}
