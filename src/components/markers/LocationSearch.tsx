import {
  CommunityLexiconLocationAddress,
  CommunityLexiconLocationFsq,
  CommunityLexiconLocationHthree,
} from "~/generated/api";
import { Bookmark, LandPlot, MapPinned, PartyPopper } from "lucide-react";

import { Autocomplete } from "../Autocomplete";
import { Input } from "../ui/input";
import { useState } from "react";
import { match, P } from "ts-pattern";

const sleep = (seconds: number) =>
  new Promise((res) => setTimeout(res, seconds * 1000));

interface GazeteerLocation {
  source: string;
  label: string;
  sourceUri?: string;
  location:
    | CommunityLexiconLocationAddress.Main
    | CommunityLexiconLocationHthree.Main
    | CommunityLexiconLocationFsq.Main;
  icon: React.ElementType;
}

const LOCATIONS: GazeteerLocation[] = [
  {
    source: "Open Maps",
    label: "1000 Cool Location Avenue, Awesome City",
    location: {
      $type: "community.lexicon.location.address",
      country: "US",
      street: "1000 Cool Location Avenue",
      locality: "Awesome City",
    } satisfies CommunityLexiconLocationAddress.Main,
    icon: MapPinned,
  },
  {
    source: "4Square Places",
    label: "Lit Event Venue @ 1000 Cool Location Avenue, Awesome City",
    sourceUri: "at://FSQ_PROVIDED_DID/com.foursquare.places/fsqid_123456789",
    location: {
      $type: "community.lexicon.location.fsq",
      name: "Lit Event Venue",
      latitude: "1337",
      longitude: "1337",
      fsq_place_id: "fsqid_123456789",
    } satisfies CommunityLexiconLocationFsq.Main,
    icon: LandPlot,
  },
  {
    source: "Hip Events in Your Area",
    label:
      "Eras Tour (May 2894) — Lit Event Venue @ 1000 Cool Location Avenue, Awesome City",
    sourceUri: "at://HIP_EVENTS_DID/events.hipmaps.tours/specific-tour-key",
    location: {
      $type: "community.lexicon.location.fsq",
      name: "Lit Event Venue",
      latitude: "1337",
      longitude: "1337",
      fsq_place_id: "0123456789",
    } satisfies CommunityLexiconLocationFsq.Main,
    icon: PartyPopper,
  },
  {
    source: "Your Relationship Diary",
    label: "Our first date 💜 — Cool Location Avenue, Awesome City",
    sourceUri: "at://USER_DID/diary.relationships.places/some-record-key",
    location: {
      $type: "community.lexicon.location.hthree",
      name: "Cool Location Avenue, Awesome City",
      value: "8549b11bfffffff",
    } satisfies CommunityLexiconLocationHthree.Main,
    icon: Bookmark,
  },
];

const loadData = async (addressQuery: string) => {
  await sleep(0.5);
  return LOCATIONS;
};

const LocationItem = (props: GazeteerLocation) => {
  return (
    <div className="flex flex-col items-start gap-0 max-w-full truncate">
      <div className="text-nowrap max-w-full truncate">{props.label}</div>
      <div className="text-sm flex text-gray-400 items-center gap-1 max-w-full">
        <div>From: </div> {props.source} <props.icon />
      </div>
    </div>
  );
};

const AddressLexiconForm = (
  props: CommunityLexiconLocationAddress.Main & { prefix: string }
) => {
  return (
    <>
      <Input
        type="hidden"
        name={`${props.prefix}.$type`}
        value="community.lexicon.location.address"
      />
      <Input type="hidden" name={`${props.prefix}.name`} value={props.name} />
      <Input
        type="hidden"
        name={`${props.prefix}.region`}
        value={props.region}
      />
      <Input
        type="hidden"
        name={`${props.prefix}.street`}
        value={props.street}
      />
      <Input
        type="hidden"
        name={`${props.prefix}.country`}
        value={props.country}
      />
      <Input
        type="hidden"
        name={`${props.prefix}.locality`}
        value={props.locality}
      />
      <Input
        type="hidden"
        name={`${props.prefix}.postalCode`}
        value={props.postalCode}
      />
    </>
  );
};

const HthreeLexiconForm = (
  props: CommunityLexiconLocationHthree.Main & { prefix: string }
) => {
  return (
    <>
      <Input
        type="hidden"
        name={`${props.prefix}.$type`}
        value="community.lexicon.location.hthree"
      />
      <Input type="hidden" name={`${props.prefix}.name`} value={props.name} />
      <Input type="hidden" name={`${props.prefix}.value`} value={props.value} />
    </>
  );
};

const FsqLexiconForm = (
  props: CommunityLexiconLocationFsq.Main & { prefix: string }
) => {
  return (
    <>
      <Input
        type="hidden"
        name={`${props.prefix}.$type`}
        value="community.lexicon.location.fsq"
      />
      <Input type="hidden" name={`${props.prefix}.name`} value={props.name} />
      <Input
        type="hidden"
        name={`${props.prefix}.latitude`}
        value={props.latitude}
      />
      <Input
        type="hidden"
        name={`${props.prefix}.longitude`}
        value={props.longitude}
      />
      <Input
        type="hidden"
        name={`${props.prefix}.fsq_place_id`}
        value={props.fsq_place_id}
      />
    </>
  );
};

export const LocationSearch = (props: {
  onSelectLocation?: (
    location:
      | CommunityLexiconLocationHthree.Main
      | CommunityLexiconLocationFsq.Main
      | CommunityLexiconLocationAddress.Main
      | undefined
  ) => void;
  prefix: string;
}) => {
  const [location, setLocation] = useState<
    | CommunityLexiconLocationHthree.Main
    | CommunityLexiconLocationFsq.Main
    | CommunityLexiconLocationAddress.Main
    | undefined
  >(undefined);

  return (
    <>
      <Autocomplete
        renderItem={LocationItem}
        loadOptions={loadData}
        onSelect={(item) => {
          setLocation(item?.location);
          props.onSelectLocation?.(item?.location);
        }}
      />
      {match(location)
        .with({ $type: "community.lexicon.location.address" }, (address) => (
          <AddressLexiconForm {...address} prefix={props.prefix} />
        ))
        .with({ $type: "community.lexicon.location.hthree" }, (hthree) => (
          <HthreeLexiconForm {...hthree} prefix={props.prefix} />
        ))
        .with({ $type: "community.lexicon.location.fsq" }, (fsq) => (
          <FsqLexiconForm {...fsq} prefix={props.prefix} />
        ))
        .with(P.nullish, () => null)
        .exhaustive()}
    </>
  );
};
