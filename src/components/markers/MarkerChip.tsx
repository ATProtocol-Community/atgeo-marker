import {
  CommunityLexiconLocationAddress,
  CommunityLexiconLocationFsq,
  CommunityLexiconLocationGeo,
  CommunityLexiconLocationHthree,
} from "~/generated/api";
import { MarkerView } from "~/generated/api/types/community/atprotocol/geomarker/defs";
import { match, P } from "ts-pattern";
import { isMain as isAddress } from "~/generated/server/types/community/lexicon/location/address";
import { isMain as isGeo } from "~/generated/server/types/community/lexicon/location/geo";
import { isMain as isFsq } from "~/generated/server/types/community/lexicon/location/fsq";
import { isMain as isHthree } from "~/generated/server/types/community/lexicon/location/hthree";

const AddressChip = ({
  marker,
  location,
}: {
  marker: MarkerView;
  location: CommunityLexiconLocationAddress.Main;
}) => {
  return (
    <div>
      <a href={`https://pdsls.dev/${marker.uri}`}>
        📍 {location.country} {!!marker.label && `— ${marker.label}`}
      </a>
    </div>
  );
};

const GeoChip = ({
  marker,
  location,
}: {
  marker: MarkerView;
  location: CommunityLexiconLocationGeo.Main;
}) => {
  return <div>GeoChip</div>;
};

const FsqChip = ({
  marker,
  location,
}: {
  marker: MarkerView;
  location: CommunityLexiconLocationFsq.Main;
}) => {
  return <div>FsqChip</div>;
};

const HthreeChip = ({
  marker,
  location,
}: {
  marker: MarkerView;
  location: CommunityLexiconLocationHthree.Main;
}) => {
  return <div>HthreeChip</div>;
};

export const MarkerChip = ({ marker }: { marker: MarkerView }) => {
  return (
    <div>
      {match(marker.location)
        .when(isAddress<MarkerView["location"]>, (location) => (
          <AddressChip marker={marker} location={location} />
        ))
        .when(isGeo<MarkerView["location"]>, (location) => (
          <GeoChip
            marker={marker}
            location={location as CommunityLexiconLocationGeo.Main}
          />
        ))
        .when(isFsq<MarkerView["location"]>, (location) => (
          <FsqChip
            marker={marker}
            location={location as CommunityLexiconLocationFsq.Main}
          />
        ))
        .when(isHthree<MarkerView["location"]>, (location) => (
          <HthreeChip
            marker={marker}
            location={location as CommunityLexiconLocationHthree.Main}
          />
        ))
        .with({ $type: P.string }, (location) => (
          <div>Unknown location type: {location.$type}</div>
        ))
        .exhaustive()}
    </div>
  );
};
