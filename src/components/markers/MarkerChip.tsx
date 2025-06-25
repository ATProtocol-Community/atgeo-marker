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
import { LandPlot, MapPinned, Pyramid } from "lucide-react";
import clsx from "clsx";

const AddressChip = ({
  marker,
  location,
}: {
  marker: MarkerView;
  location: CommunityLexiconLocationAddress.Main;
}) => {
  return (
    <>
      <MapPinned className="w-4 h-4" />
      <div>
        {location.street} {location.country}
        {!!marker.label && (
          <div className="text-sm flex text-gray-400">{marker.label}</div>
        )}
        {!!marker.locationSource && (
          <div className="text-sm flex text-gray-400">
            {marker.locationSource?.name}
          </div>
        )}
      </div>
    </>
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
  return (
    <>
      <LandPlot className="w-4 h-4" />
      <div>
        <div>{location.name}</div>
        {!!marker.label && (
          <div className="text-sm flex text-gray-400 items-center gap-1 max-w-full">
            {marker.label}
          </div>
        )}
        {!!marker.locationSource && (
          <div className="text-sm flex text-gray-400">
            {marker.locationSource?.name}
          </div>
        )}
      </div>
    </>
  );
};

const HthreeChip = ({
  marker,
  location,
}: {
  marker: MarkerView;
  location: CommunityLexiconLocationHthree.Main;
}) => {
  return (
    <>
      <Pyramid className="w-4 h-4" />
      <div>
        <div>{location.name}</div>
        {!!marker.label && (
          <div className="text-sm flex text-gray-400 items-center gap-1 max-w-full">
            {marker.label}
          </div>
        )}
        {!!marker.locationSource && (
          <div className="text-sm flex text-gray-400">
            {marker.locationSource?.name}
          </div>
        )}
      </div>
    </>
  );
};

export const MarkerChip = ({ marker }: { marker: MarkerView }) => {
  return (
    <a
      href={`https://pdsls.dev/${marker.uri}`}
      className="max-w-[300px] rounded bg-primary/40 p-2 flex items-center gap-2 border-2 border-blue-600 hover:bg-primary/80"
    >
      {match(marker.location)
        .when(isAddress<MarkerView["location"]>, (location) => (
          <AddressChip marker={marker} location={location} />
        ))
        .when(isGeo<MarkerView["location"]>, (location) => (
          <GeoChip marker={marker} location={location} />
        ))
        .when(isFsq<MarkerView["location"]>, (location) => (
          <FsqChip marker={marker} location={location} />
        ))
        .when(isHthree<MarkerView["location"]>, (location) => (
          <HthreeChip marker={marker} location={location} />
        ))
        .with({ $type: P.string }, (location) => (
          <div>Unknown location type: {location.$type}</div>
        ))
        .exhaustive()}
    </a>
  );
};
