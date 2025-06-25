import { createFileRoute, Navigate } from "@tanstack/react-router";
import { MarkerForm } from "~/components/markers/MarkerForm";
import { useState } from "react";
import { getLoggedInMarkerAgent, getDidFromHandle } from "~/lib/auth";
import { createServerFn } from "@tanstack/react-start";
import { MarkerView } from "~/generated/api/types/community/atprotocol/geomarker/defs";
import { InvalidRequestError } from "@atproto/xrpc-server";
import { MarkerChip } from "~/components/markers/MarkerChip.jsx";

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
    try {
      const markers =
        await markerAgent.community.atprotocol.geomarker.getMarkers({
          owner: loadedData.did,
        });

      if (!markers.success) {
        throw new Error("Failed to get markers for did: " + loadedData.did);
      }
      return markers.data.markers;
    } catch (error) {
      if (error instanceof InvalidRequestError) {
        console.error(
          "Invalid request proxy!",
          markerAgent.headers.get("atproto-proxy")
        );
      }
      throw error;
    }
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
    <>
      <h2 className="text-2xl font-bold pt-4">Make a Marker</h2>
      <MarkerForm
        onNewMarker={(response) => {
          setMarkers((prev) => [...prev, response]);
        }}
        userDid={user.did}
      />
      <div>You have made these markers:</div>
      <div className="max-w-4xl w-full grid grid-cols-3 gap-2">
        {markers.map((marker) => (
          <MarkerChip key={marker.uri} marker={marker} />
        ))}
      </div>
    </>
  );
}
