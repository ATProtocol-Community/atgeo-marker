import { Record as AtpCommunityGeomarker } from "~/generated/api/types/community/atprotocol/geomarker/marker";
import { Main as LexiconLocationGeo } from "~/generated/api/types/community/lexicon/location/geo";
import { Main as LexiconLocationAddress } from "~/generated/api/types/community/lexicon/location/address";
import { NominatimResult } from "~/components/SearchNominatim";

interface DollarSignType {
  $type: string;
}

type WithType<T> = T & DollarSignType;

function extractGeo(location: NominatimResult): WithType<LexiconLocationGeo> {
  return {
    $type: "community.lexicon.location.geo",
    name: location.display_name,
    latitude: location.lat,
    longitude: location.lon,
  };
}

function extractAddress(
  location: NominatimResult,
): WithType<LexiconLocationAddress> | null {
  if (
    !location.address.country ||
    !location.address.road ||
    !location.address.postcode
  )
    return null;

  return {
    $type: "community.lexicon.location.address",
    name: location.display_name,
    country: location.address.country,
    locality:
      location.address.city ||
      location.address.county ||
      location.address.suburb,
    street: (
      location.address.house_number +
      " " +
      location.address.road
    ).trim(),
    postalCode: location.address.postcode,
    region: location.address.state,
  };
}

function nominatimToGeomarker(
  loc: NominatimResult,
): AtpCommunityGeomarker | Error {
  let location: AtpCommunityGeomarker["location"] | null = null;

  let geo = extractGeo(loc);

  if (geo) {
    location = geo;
  }

  let address = extractAddress(loc);

  if (address) {
    location = address;
  }

  if (location === null)
    return Error(
      "Could not extract valid Geomarker location from Nominatim result",
    );

  return {
    id: loc.osm_id,
    name: loc.display_name,
    $type: "community.atprotocol.geomarker.marker",
    location,
  };
}
