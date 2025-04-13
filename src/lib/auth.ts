import { NodeOAuthClient, TokenRefreshError } from "@atproto/oauth-client-node";
import { JoseKey } from "@atproto/jwk-jose";
import { Agent } from "@atproto/api";
import { nanoid } from "nanoid";
import path from "path";
import { mkdir, unlink, readFile, writeFile, rm } from "fs/promises";

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

export const getLoggedInBskyAgent = async (
  user: { handle: string } | { did: string }
) => {
  const agent = new Agent("https://public.api.bsky.app");
  const did =
    "did" in user
      ? user.did
      : (await agent.resolveHandle({ handle: user.handle })).data.did;

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

export async function loginToBsky({ user }: { user: string }) {
  const agent = new Agent("https://public.api.bsky.app");
  const handle = await agent.resolveHandle({
    handle: user,
  });

  if (!handle.success) {
    throw new Error("Failed to resolve handle");
  }

  const state = nanoid();
  const url = await oauthClient.authorize(handle.data.did, {
    scope: "atproto transition:generic",
    state,
  });

  return url.href;
}

export async function logoutFromBsky({ did }: { did: string }) {
  await oauthClient.revoke(did);
}
