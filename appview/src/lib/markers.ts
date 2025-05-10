import { Record } from "~/generated/server/types/com/atproto/repo/listRecords";
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
  return {
    ...marker.value,
    uri: record.uri,
  };
};
