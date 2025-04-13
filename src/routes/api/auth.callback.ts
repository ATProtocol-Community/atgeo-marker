import { createAPIFileRoute } from "@tanstack/react-start/api";
import { createNewUserSession } from "~/components/Login";
import { oauthClient } from "~/lib/auth";

export const APIRoute = createAPIFileRoute("/api/auth/callback")({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const client = await oauthClient.callback(url.searchParams);

    await createNewUserSession({ did: client.session.did });

    return new Response("ok", {
      status: 302,
      headers: { Location: "/" },
    });
  },
});
