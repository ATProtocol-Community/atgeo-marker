import express from "express";
import { createServer } from "generated/server";
import { getDidManifest } from "./did";
import dotenv from "dotenv";
import { Agent } from "@atproto/api";
import {
  validateRecord,
  Record as MarkerRecord,
} from "~/generated/server/types/community/atprotocol/geomarker/marker";

// Load .env file from both the current directory and parent directory
// The first .env file takes precedence
dotenv.config({ path: [".env", "../.env"] });

const app = express();

if (!process.env.MARKER_APPVIEW_DID) {
  throw new Error("MARKER_APPVIEW_DID is not set");
}
if (
  !process.env.MARKER_APPVIEW_SERVICE_ENDPOINT &&
  !process.env.MARKER_APPVIEW_DID.startsWith("did:web:")
) {
  throw new Error(
    "MARKER_APPVIEW_SERVICE_ENDPOINT is not set and MARKER_APPVIEW_DID is not a did:web"
  );
}

const appviewServiceEndpoint =
  process.env.MARKER_APPVIEW_SERVICE_ENDPOINT ??
  `https://${process.env.MARKER_APPVIEW_DID.replace("did:web:", "")}`;

const server = createServer({
  validateResponse: false,
  payload: {
    jsonLimit: 100 * 1024, // 100kb
    textLimit: 100 * 1024, // 100kb
    // no blobs
    blobLimit: 0,
  },
});

server.community.atprotocol.geomarker.getMarkers({
  handler: async ({ params, auth, req }) => {
    const markerAgent = new Agent({
      service: "https://bsky.social",
    });

    const markers = await markerAgent.com.atproto.repo.listRecords({
      repo: params.owner,
      collection: "community.atprotocol.geomarker.marker",
      limit: 100,
    });

    return {
      encoding: "application/json",
      body: {
        markers: markers.data.records
          .filter((record) => {
            // Only return valid marker records
            const marker = validateRecord<MarkerRecord>(record.value as any);
            return marker.success;
          })
          .map((record) => {
            return {
              ...record.value,
              atUri: record.uri,
            };
          }),
      },
    };
  },
});

app.use(server.xrpc.router);

app.get("/.well-known/did.json", (_, res) => {
  res.json(
    getDidManifest({
      did: process.env.MARKER_APPVIEW_DID!,
      serviceEndpoint: appviewServiceEndpoint,
    })
  );
});

app.get("/", (_, res) => {
  res.send("I live!");
});

app.listen(process.env.APPVIEW_PORT ?? 3000, () => {
  console.log(
    `Server is running on port ${process.env.APPVIEW_PORT ?? 3000} with did ${
      process.env.MARKER_APPVIEW_DID
    }`
  );
});
