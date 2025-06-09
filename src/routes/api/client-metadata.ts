import { json } from "@tanstack/react-start";
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { CLIENT_METADATA } from "~/lib/auth";

export const APIRoute = createAPIFileRoute("/api/client-metadata")({
  GET: () => {
    return json(CLIENT_METADATA);
  },
});
