import { createFileRoute } from "@tanstack/react-router";
import Map from "~/components/map/Map";

export const Route = createFileRoute("/map/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <main className="flex h-screen flex-col items-center justify-center">
      <Map />
    </main>
  );
}
