import { AtUri } from "@atproto/api";
import { Record } from "~/generated/server/types/com/atproto/repo/listRecords";
import { LocationServiceView } from "~/generated/server/types/community/atprotocol/geomarker/defs";
import {
  validateRecord as validateMarkerRecord,
  Record as MarkerRecord,
} from "~/generated/server/types/community/atprotocol/geomarker/marker";

export const extractValidMarkerRecord = (
  record: Record
): (MarkerRecord & { uri: string }) | null => {
  const marker = validateMarkerRecord(record.value);
  if (!marker.success) {
    return null;
  }
  console.dir(marker.value, { depth: null });
  return {
    ...marker.value,
    uri: record.uri,
  };
};

const getLocationServiceName = (locationSource: string) => {
  const atUri = new AtUri(locationSource);
  if (atUri.host.startsWith("did:web:")) {
    return atUri.host.split("web:")[1];
  }
  if (atUri.host.startsWith("did:plc:")) {
    return atUri.collection;
  }
  return atUri.host;
};

export const makeLocationSourceView = (
  locationSource: string | undefined
): LocationServiceView | undefined => {
  if (!locationSource) {
    return undefined;
  }
  return {
    $type: "community.atprotocol.geomarker.defs#locationServiceView",
    name: getLocationServiceName(locationSource),
    originalUri: locationSource,
  };
};
