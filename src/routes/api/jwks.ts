import { json } from "@tanstack/react-start";
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { oauthClient } from "~/lib/auth";

export const APIRoute = createAPIFileRoute("/api/jwks")({
  GET: () => {
    return json(oauthClient.jwks);
  },
});
