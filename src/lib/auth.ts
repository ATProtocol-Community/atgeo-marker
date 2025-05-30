import { NodeOAuthClient, TokenRefreshError } from "@atproto/oauth-client-node";
import { JoseKey } from "@atproto/jwk-jose";
import { Agent } from "@atproto/api";
import { nanoid } from "nanoid";
import path from "path";
import { mkdir, unlink, readFile, writeFile, rm } from "fs/promises";
import { AtpBaseClient as MarkerAgent } from "~/generated/api";

import type {
  NodeOAuthClientOptions,
  NodeSavedSession,
  NodeSavedSessionStore,
  NodeSavedState,
  NodeSavedStateStore,
} from "@atproto/oauth-client-node";

const getChallengePath = ({ key }: { key: string }) =>
  path.join(".tokens/challenges", key, "auth-challenge.json");

const getSessionPath = ({ did }: { did: string }) =>
  path.join(".tokens/sessions", did, "auth-session.json");

class StateStore implements NodeSavedStateStore {
  async get(key: string): Promise<NodeSavedState | undefined> {
    return JSON.parse(
      await readFile(getChallengePath({ key }), "utf-8")
    ) as NodeSavedState;
  }
  async set(key: string, val: NodeSavedState) {
    const state = JSON.stringify(val);
    await mkdir(path.dirname(getChallengePath({ key })), { recursive: true });
    await writeFile(getChallengePath({ key }), state);
  }
  async del(key: string) {
    const challengePath = getChallengePath({ key });
    await unlink(challengePath);
    await rm(path.dirname(challengePath), { recursive: true, force: true });
  }
}

class SessionStore implements NodeSavedSessionStore {
  async get(key: string): Promise<NodeSavedSession | undefined> {
    try {
      return JSON.parse(
        await readFile(getSessionPath({ did: key }), "utf-8")
      ) as NodeSavedSession;
    } catch (e) {
      if (e instanceof Error && e.message.includes("ENOENT")) {
        return undefined;
      }
      throw e;
    }
  }
  async set(key: string, val: NodeSavedSession) {
    const session = JSON.stringify(val);
    await mkdir(path.dirname(getSessionPath({ did: key })), {
      recursive: true,
    });
    await writeFile(getSessionPath({ did: key }), session);
  }
  async del(key: string) {
    const sessionPath = getSessionPath({ did: key });
    await unlink(sessionPath);
    await rm(path.dirname(sessionPath), { recursive: true, force: true });
  }
}

// We're running this local only for now, so we can use localhost
// Note: you must use the default port for this to work, so we
// cannot run a dev server on one of the usual ports
const PUBLIC_URL = "http://127.0.0.1/";
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
  client_id: `http://localhost?${LOCAL_SEARCH_PARAMS.toString()}`,
  client_uri: PUBLIC_URL,
  redirect_uris: [new URL(REDIRECT_PATH, PUBLIC_URL).toString()],
  scope: ALLOWED_SCOPES,
  grant_types: ["authorization_code", "refresh_token"],
  response_types: ["code"],
  application_type: "web",
  token_endpoint_auth_method: "none",
  dpop_bound_access_tokens: true,
  jwks_uri: new URL("/jwks.json", PUBLIC_URL).toString(),
} satisfies NodeOAuthClientOptions["clientMetadata"];

const createClient = async () => {
  if (!PUBLIC_URL) {
    throw new Error("PUBLIC_URL is not set but is required for oauth.");
  }

  return new NodeOAuthClient({
    clientMetadata: CLIENT_METADATA,
    keyset: await Promise.all([JoseKey.generate()]),
    stateStore: new StateStore(),
    sessionStore: new SessionStore(),
  });
};

export const oauthClient = await createClient();

// TODO: incredible HACK, DO NOT PUT THIS IN PRODUCTION
let LOGGED_IN_AGENT: Agent | null = null;
export const getLoggedInBskyAgent = async (
  user: { handle: string } | { did: string }
) => {
  if (LOGGED_IN_AGENT && LOGGED_IN_AGENT.assertAuthenticated()) {
    return LOGGED_IN_AGENT;
  }

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
    LOGGED_IN_AGENT = null;
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

export async function loginToBsky({ user }: { user: string }) {
  const did = await oauthClient.handleResolver.resolve(user);
  if (!did) {
    throw new Error(`Failed to resolve handle for user ${user}`);
  }

  const state = nanoid();
  const url = await oauthClient.authorize(did, {
    scope: "atproto transition:generic",
    state,
  });

  return url.href;
}

export async function logoutFromBsky({ did }: { did: string }) {
  await oauthClient.revoke(did);
  LOGGED_IN_AGENT = null;
}
