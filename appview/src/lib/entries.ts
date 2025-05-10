import { Agent, AtUri } from "@atproto/api";

export const fetchEntryView = async ({ entryUri }: { entryUri: AtUri }) => {
  const collection = entryUri.collection;

  const agent = new Agent({
    service: "https://bsky.social",
  });
  const record = await agent.com.atproto.repo.getRecord({
    repo: entryUri.host,
    collection,
    rkey: entryUri.rkey,
  });

  if (record.success) {
    return {
      $type: "community.atprotocol.geomarker.defs#entryView",
      uri: entryUri.toString(),
      record: {
        $type: collection,
        text: record.data.value.text,
      },
    } as const;
  }

  return {
    $type: "community.atprotocol.geomarker.defs#entryView",
    uri: entryUri.toString(),
    record: null,
  } as const;
};
