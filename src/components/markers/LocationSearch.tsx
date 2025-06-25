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

import {
  useFieldContext,
  AddressLexiconForm,
  HthreeLexiconForm,
  FsqLexiconForm,
} from "./LocationForm";

const sleep = (seconds: number) =>
  new Promise((res) => setTimeout(res, seconds * 1000));

export interface GazeteerLocation {
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
    sourceUri:
      "at://did:web:fakesquare.com/com.foursquare.places/fsqid_123456789",
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
    sourceUri:
      "at://did:web:fakeevents.com/events.hipmaps.tours/specific-tour-key",
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

const loadData = async (addressQuery: string, userDid: string) => {
  await sleep(0.5);
  return LOCATIONS.map((location) => ({
    ...location,
    // We need to replace the USER_DID with the current user's DID
    sourceUri: location.sourceUri?.replace("USER_DID", userDid),
  }));
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

export const LocationSearch = (props: {
  onSelectLocation?: (location: GazeteerLocation | undefined) => void;
  prefix: string;
  userDid: string;
}) => {
  const field = useFieldContext<GazeteerLocation | undefined>();
  const [location, setLocation] = useState<GazeteerLocation | undefined>(
    field.state.value
  );

  return (
    <>
      <Autocomplete
        renderItem={LocationItem}
        loadOptions={(addressQuery) => loadData(addressQuery, props.userDid)}
        onSelect={(item) => {
          setLocation(item);
          props.onSelectLocation?.(item);

          field.handleChange(item);
        }}
      />
      {location && (
        <Input
          type="hidden"
          name={`${field.name}.locationSource`}
          value={location.sourceUri}
        />
      )}
      {match(location?.location)
        // This displays the form for the specific location within the larger location
        // returned from the gazeteer.
        .with({ $type: "community.lexicon.location.address" }, () => (
          <AddressLexiconForm />
        ))
        .with({ $type: "community.lexicon.location.hthree" }, (hthree) => (
          <HthreeLexiconForm />
        ))
        .with({ $type: "community.lexicon.location.fsq" }, (fsq) => (
          <FsqLexiconForm />
        ))
        .with(P.nullish, () => null)
        // TODO: this is for addresses that do not have the $type field
        // We should not be able to get here.
        .with(P.any, () => {
          throw new Error("Invalid location");
        })
        .exhaustive()}
    </>
  );
};
