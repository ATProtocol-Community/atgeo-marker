import { NodeOAuthClient, TokenRefreshError } from "@atproto/oauth-client-node";
import { JoseKey } from "@atproto/jwk-jose";
import { Agent } from "@atproto/api";
import { nanoid } from "nanoid";
import { AtpBaseClient as MarkerAgent } from "~/generated/api";

import type {
  NodeOAuthClientOptions,
  NodeSavedSession,
  NodeSavedSessionStore,
  NodeSavedState,
  NodeSavedStateStore,
} from "@atproto/oauth-client-node";
import { db } from "~/db";

class StateStore implements NodeSavedStateStore {
  async get(key: string): Promise<NodeSavedState | undefined> {
    const stateByKey = await db
      .selectFrom("bsky_auth_state")
      .where("key", "=", key)
      .selectAll()
      .executeTakeFirst();

    if (!stateByKey) {
      return;
    }
    return JSON.parse(stateByKey.state) as NodeSavedState;
  }
  async set(key: string, val: NodeSavedState) {
    console.log("auth state key", key);
    await db
      .insertInto("bsky_auth_state")
      .values({
        key,
        state: JSON.stringify(val),
      })
      .execute();
  }
  async del(key: string) {
    await db.deleteFrom("bsky_auth_state").where("key", "=", key).execute();
  }
}

class SessionStore implements NodeSavedSessionStore {
  async get(key: string): Promise<NodeSavedSession | undefined> {
    const sessionByKey = await db
      .selectFrom("bsky_auth_sessions")
      .where("key", "=", key)
      .selectAll()
      .executeTakeFirst();

    if (!sessionByKey) {
      return;
    }
    return JSON.parse(sessionByKey.session) as NodeSavedSession;
  }
  async set(key: string, val: NodeSavedSession) {
    await db
      .insertInto("bsky_auth_sessions")
      .values({
        key,
        session: JSON.stringify(val),
      })
      .onConflict((oc) => oc.doUpdateSet({ session: JSON.stringify(val) }))
      .execute();
  }
  async del(key: string) {
    await db.deleteFrom("bsky_auth_sessions").where("key", "=", key).execute();
  }
}

const IS_DEVELOPMENT = process.env.NODE_ENV == "development";

// Note: on local you must use the default port for this to work, so we
// cannot run a dev server on one of the usual ports
const PUBLIC_URL =
  process.env.PUBLIC_URL || (IS_DEVELOPMENT ? "http://127.0.0.1/" : undefined);
const ALLOWED_SCOPES = "atproto transition:generic";
const REDIRECT_PATH = "/api/auth/callback";

// In local clients configuration for allowed scopes and redirects
// is done through search params
// See: https://atproto.com/specs/oauth#clients
const LOCAL_SEARCH_PARAMS = new URLSearchParams({
  scope: ALLOWED_SCOPES,
  redirect_uri: new URL(REDIRECT_PATH, PUBLIC_URL).toString(),
});

export const CLIENT_METADATA = {
  client_name: "ATgeo Marker",
  client_id: IS_DEVELOPMENT
    ? `http://localhost?${LOCAL_SEARCH_PARAMS.toString()}`
    : new URL("/api/client-metadata", PUBLIC_URL).toString(),
  client_uri: PUBLIC_URL,
  redirect_uris: [new URL(REDIRECT_PATH, PUBLIC_URL).toString()],
  scope: ALLOWED_SCOPES,
  grant_types: ["authorization_code", "refresh_token"],
  response_types: ["code"],
  application_type: "web",
  token_endpoint_auth_method: "none",
  dpop_bound_access_tokens: true,
  jwks_uri: new URL("/api/jwks", PUBLIC_URL).toString(),
} satisfies NodeOAuthClientOptions["clientMetadata"];

export const JWK = await JoseKey.generate();

const createClient = async () => {
  if (!PUBLIC_URL) {
    throw new Error("PUBLIC_URL is not set but is required for oauth.");
  }

  return new NodeOAuthClient({
    clientMetadata: CLIENT_METADATA,
    keyset: [JWK],
    stateStore: new StateStore(),
    sessionStore: new SessionStore(),
  });
};

export const oauthClient = await createClient();

export const getLoggedInAppBskyAgent = async (
  user: { handle: string } | { did: string }
) => {
  const did =
    "did" in user
      ? user.did
      : await oauthClient.handleResolver.resolve(user.handle);

  if (!did) {
    throw new Error(
      `Failed to resolve handle for user ${
        "did" in user ? user.did : user.handle
      }`
    );
  }

  try {
    const session = await oauthClient.restore(did);
    if (session) {
      const agent: Agent = new Agent(session);

      agent.assertAuthenticated();
      return agent;
    }
  } catch (e) {
    if (e instanceof TokenRefreshError) {
      // Token refresh failed, so we need to login again
      return null;
    }
    throw e;
  }
  return null;
};

export const getDidFromHandle = async ({ handle }: { handle: string }) => {
  const did = await oauthClient.handleResolver.resolve(handle);
  if (!did) {
    throw new Error(`Failed to resolve did for user ${handle}`);
  }
  return did;
};

export const getLoggedInMarkerAgent = async (user: { handle: string }) => {
  const did = await oauthClient.handleResolver.resolve(user.handle);
  if (!did) {
    throw new Error(`Failed to resolve did for user ${user.handle}`);
  }
  const session = await oauthClient.restore(did);
  // Make sure the marker agent use the session's fetch handler for authenticated
  // requests
  const markerAgent = new MarkerAgent(session.fetchHandler.bind(session));
  // // Forward requrests made by the marker agent to our AppView
  markerAgent.setHeader(
    "atproto-proxy",
    `${process.env.MARKER_APPVIEW_DID}#geomarker_appview`
  );
  return markerAgent;
};

export async function loginToPds({ user }: { user: string }) {
  const did = await oauthClient.handleResolver.resolve(user);
  if (!did) {
    throw new Error(`Failed to resolve handle for user ${user}`);
  }

  // TODO: double check if this needs to be cryptographically secure
  const state = nanoid();
  const url = await oauthClient.authorize(did, {
    scope: "atproto transition:generic",
    state,
  });

  return url.href;
}

export async function logoutFromPds({ did }: { did: string }) {
  await oauthClient.revoke(did);
}
