import { redirect } from "@tanstack/react-router";
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { getEvent, useSession } from "@tanstack/react-start/server";
import { oauthClient } from "~/lib/auth";

export const APIRoute = createAPIFileRoute("/api/auth/callback")({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const client = await oauthClient.callback(url.searchParams);

    const event = getEvent();
    const session = await useSession(event, {
      // TODO: obviously not a good idea to have a hardcoded password
      password: "i too am a friend of goosetopher",
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
