import { createFileRoute, Navigate } from "@tanstack/react-router";
import { MarkerForm, MarkerView } from "~/components/MarkerForm";
import { useState } from "react";
import { getLoggedInMarkerAgent, getDidFromHandle } from "~/lib/auth";
import { createServerFn } from "@tanstack/react-start";

const getMarkersForHandle = createServerFn({ method: "GET" })
  .validator(async (params: { handle: string }) => {
    const did = await getDidFromHandle({ handle: params.handle });
    return {
      handle: params.handle,
      did,
    };
  })
  .handler(async ({ data }) => {
    const loadedData = await data;
    const markerAgent = await getLoggedInMarkerAgent({
      handle: loadedData.handle,
    });
    if (!markerAgent) {
      throw new Error("Failed to get marker agent");
    }
    const markers = await markerAgent.community.atprotocol.geomarker.getMarkers(
      {
        owner: loadedData.handle,
      }
    );

    if (!markers.success) {
      throw new Error("Failed to get markers for did: " + loadedData.did);
    }
    return markers.data.markers;
  });

export const Route = createFileRoute("/")({
  component: Home,
  loader: async ({ context }) => {
    const user = context.user;
    if (!user) {
      return {
        user: undefined,
        markers: [] as MarkerView[],
      };
    }

    const markers = await getMarkersForHandle({
      data: { handle: user.handle },
    });

    return {
      user,
      markers,
    };
  },
});

function Home() {
  const { user } = Route.useRouteContext();
  const { markers: serverMarkers } = Route.useLoaderData();
  const [markers, setMarkers] = useState<MarkerView[]>(serverMarkers);

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
