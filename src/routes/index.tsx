import { createFileRoute, Navigate } from "@tanstack/react-router";
import { MarkerForm, MarkerView } from "~/components/MarkerForm";
import { useState } from "react";

export const Route = createFileRoute("/")({
  component: Home,
  loader: async ({ context }) => {
    const user = context.user;
    if (!user) {
      return undefined;
    }
    return {
      user,
    };
  },
});

function Home() {
  const { user } = Route.useRouteContext();
  const [markers, setMarkers] = useState<MarkerView[]>([]);

  if (!user) {
    // redirect to /auth/login
    return <Navigate to="/auth/login" reloadDocument />;
  }

  return (
    <main className="flex h-screen flex-col items-center justify-center gap-4">
      <div>Hello {user.handle}</div>
      <div>Make a Marker</div>
      <MarkerForm
        onNewMarker={(response) => {
          setMarkers((prev) => [...prev, response]);
        }}
      />
      <div>You have made these markers:</div>
      {markers.map((marker) => (
        <div key={marker.markerUri}>
          <a href={`https://pdsls.dev/${marker.markerUri}`}>
            📍 {marker.location} {!!marker.label && `— ${marker.label}ß`}
          </a>
        </div>
      ))}
    </main>
  );
}
