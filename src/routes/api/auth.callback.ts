import { createAPIFileRoute } from "@tanstack/react-start/api";
import { useSession } from "@tanstack/react-start/server";
import { getEvent } from "@tanstack/react-start/server";
import { SESSION_STORE_PASSWORD } from "~/components/auth/Login";
import { oauthClient } from "~/lib/auth";

export const APIRoute = createAPIFileRoute("/api/auth/callback")({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const client = await oauthClient.callback(url.searchParams);

    const event = getEvent();
    const session = await useSession(event, {
      password: SESSION_STORE_PASSWORD,
    });
    await session.update({
      did: client.session.did,
    });

    return new Response("ok", {
      status: 302,
      headers: { Location: "/" },
    });
  },
});
