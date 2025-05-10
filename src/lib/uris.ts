import { Agent } from "@atproto/api";

// @ts-ignore: Property 'UrlPattern' does not exist
if (!globalThis.URLPattern) {
  await import("urlpattern-polyfill");
}

const COLLECTIONS_URI_PATTERNS = {
  "app.bsky.feed.post": new URLPattern({
    pathname: "/profile/:handle/post/:rkey",
    hostname: "bsky.app",
  }),
};

const getRecordData = (input: URL) => {
  for (const [recordType, pattern] of Object.entries(
    COLLECTIONS_URI_PATTERNS
  )) {
    if (input.hostname !== pattern.hostname) continue;
    const match = pattern.exec(input);
    if (!match) continue;
    if (!match.pathname.groups.handle || !match.pathname.groups.rkey) {
      throw new Error(" URI");
    }

    if (match.pathname.groups.handle?.startsWith("did")) {
      return {
        recordType,
        did: match.pathname.groups.handle,
        rkey: match.pathname.groups.rkey,
        handle: undefined,
      };
    } else {
      return {
        recordType,
        handle: match.pathname.groups.handle,
        rkey: match.pathname.groups.rkey,
        did: undefined,
      };
    }
  }
  return null;
};

export const toAtUri = async (input: string) => {
  const recordData = getRecordData(new URL(input));
  if (!recordData) return null;
  if (recordData.did) {
    return `at://${recordData.did}/${recordData.recordType}/${recordData.rkey}`;
  }
  const agent = new Agent("https://public.api.bsky.app");
  const record = await agent.resolveHandle({
    handle: recordData.handle!,
  });
  if (!record.success) {
    throw new Error("Failed to resolve handle");
  }
  return `at://${record.data.did}/${recordData.recordType}/${recordData.rkey}`;
};
