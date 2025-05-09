import {
  CommunityLexiconLocationAddress,
  CommunityLexiconLocationFsq,
  CommunityLexiconLocationGeo,
  CommunityLexiconLocationHthree,
} from "~/generated/api";
import { MarkerView } from "~/generated/api/types/community/atprotocol/geomarker/defs";
import { match, P } from "ts-pattern";

const AddressChip = ({
  marker,
  location,
}: {
  marker: MarkerView;
  location: CommunityLexiconLocationAddress.Main;
}) => {
  return (
    <div>
      <a href={`https://pdsls.dev/${marker.atUri}`}>
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
        .with({ $type: "community.lexicon.location.address" }, (location) => (
          <AddressChip
            marker={marker}
            location={location as CommunityLexiconLocationAddress.Main}
          />
        ))
        .with({ $type: "community.lexicon.location.geo" }, (location) => (
          <GeoChip
            marker={marker}
            location={location as CommunityLexiconLocationGeo.Main}
          />
        ))
        .with({ $type: "community.lexicon.location.fsq" }, (location) => (
          <FsqChip
            marker={marker}
            location={location as CommunityLexiconLocationFsq.Main}
          />
        ))
        .with({ $type: "community.lexicon.location.hthree" }, (location) => (
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
