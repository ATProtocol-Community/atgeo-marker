import { createFileRoute, Navigate } from "@tanstack/react-router";
import { MarkerForm } from "~/components/MarkerForm";
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
  const [markers, setMarkers] = useState<string[]>([]);

  if (!user) {
    // redirect to /auth/login
    return <Navigate to="/auth/login" reloadDocument />;
  }

  return (
    <main className="flex h-screen flex-col items-center justify-center gap-4">
      <div>Hello {user.handle}</div>
      <div>Make a Marker</div>
      <MarkerForm
        formId="marker-form"
        onNewMarker={(uri) => {
          setMarkers([...markers, uri]);
        }}
      />
      <div>You have made these markers:</div>
      {markers.map((marker) => (
        <div key={marker}>
          <a href={`https://pdsls.dev/${marker}`}>{marker}</a>
        </div>
      ))}
    </main>
  );
}
