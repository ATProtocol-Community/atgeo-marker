"use client";
import { Anchor as PopoverAnchor } from "@radix-ui/react-popover";
import { CommandInput } from "cmdk";
import {
  Bookmark,
  LandPlot,
  MapPin,
  MapPinned,
  PartyPopper,
} from "lucide-react";

import { cn } from "../lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandLoading,
} from "./ui/command";
import { Input } from "./ui/input";
import { Popover, PopoverContent } from "./ui/popover";
import {
  CommunityLexiconLocationAddress,
  CommunityLexiconLocationFsq,
  CommunityLexiconLocationHthree,
} from "~/generated/api";
import { match } from "ts-pattern";
import React from "react";

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
      country: "US",
      street: "1000 Cool Location Avenue",
      locality: "Awesome City",
    } satisfies CommunityLexiconLocationAddress.Main,
    icon: MapPinned,
  },
  {
    source: "4Square Places",
    label: "Lit Event Venue @ 1000 Cool Location Avenue, Awesome City",
    sourceUri: "at://FSQ_PROVIDED_DID/com.foursquare.venues/specific-venue-key",
    location: {
      name: "Lit Event Venue",
      latitude: "1337",
      longitude: "1337",
      fsq_place_id: "0123456789",
    } satisfies CommunityLexiconLocationFsq.Main,
    icon: LandPlot,
  },
  {
    source: "Hip Events in Your Area",
    label:
      "Eras Tour (May 2894) — Lit Event Venue @ 1000 Cool Location Avenue, Awesome City",
    sourceUri: "at://HIP_EVENTS_DID/events.hipmaps.tours/specific-tour-key",
    location: {
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

export function Autocomplete() {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [value, setValue] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [options, setOptions] = React.useState<GazeteerLocation[]>([]);

  return (
    <div className="flex items-center">
      <Popover open={open} onOpenChange={setOpen}>
        <Command>
          <PopoverAnchor asChild>
            <CommandInput
              className="bg-none outline-0 focus-visible::outline-0 border-0"
              asChild
              value={search}
              onValueChange={async (input) => {
                setSearch(input);
                if (!input.length) {
                  setOptions([]);
                  return;
                }
                setLoading(true);
                setOptions(await loadData(input));
                setLoading(false);
              }}
              onKeyDown={(e) => setOpen(e.key !== "Escape")}
              onMouseDown={() => setOpen((open) => !!search || !open)}
              onFocus={() => setOpen(true)}
              onBlur={(e) => {
                if (!e.relatedTarget?.hasAttribute("cmdk-list")) {
                  setSearch(
                    value
                      ? options.find((location) => location.label === value)
                          ?.label ?? ""
                      : ""
                  );
                }
              }}
            >
              <Input placeholder="Select location..." className="w-full" />
            </CommandInput>
          </PopoverAnchor>
          {!open && <CommandList aria-hidden="true" className="hidden" />}
          <PopoverContent
            className="w-full p-0 min-w-[500px]"
            asChild
            onOpenAutoFocus={(e) => e.preventDefault()}
            onInteractOutside={(e) => {
              if (
                e.target instanceof Element &&
                e.target.hasAttribute("cmdk-input")
              ) {
                e.preventDefault();
              }
            }}
          >
            <CommandList className="max-w-full w-[var(--radix-popover-trigger-width)]">
              {match({ loading })
                .with({ loading: true }, () => (
                  <CommandLoading>Hang on…</CommandLoading>
                ))
                .with({ loading: false }, () => (
                  <>
                    <CommandEmpty>
                      {value.length
                        ? "No location found."
                        : "Start typing to see suggestions..."}
                    </CommandEmpty>
                    <CommandGroup>
                      {options.map((option) => (
                        <CommandItem
                          className="truncate w-full overflow-hidden max-w-full"
                          key={option.label}
                          value={option.label}
                          onMouseDown={(e) => e.preventDefault()}
                          onSelect={(currentValue) => {
                            setValue(
                              currentValue === value ? "" : currentValue
                            );
                            setSearch(
                              currentValue === value
                                ? ""
                                : options.find(
                                    (location) =>
                                      location.label === currentValue
                                  )?.label ?? ""
                            );
                            setOpen(false);
                          }}
                        >
                          <MapPin
                            className={cn(
                              "mr-2 h-4 w-4",
                              value === option.label
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col items-start gap-0 max-w-full truncate">
                            <div className="text-nowrap max-w-full truncate">
                              {option.label}
                            </div>
                            <div className="text-sm flex text-gray-400 items-center gap-1 max-w-full">
                              <div>From: </div> {option.source} <option.icon />
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                ))
                .exhaustive()}
            </CommandList>
          </PopoverContent>
        </Command>
      </Popover>
    </div>
  );
}
