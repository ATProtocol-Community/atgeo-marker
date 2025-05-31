"use client";
import { Anchor as PopoverAnchor } from "@radix-ui/react-popover";
import { CommandInput } from "cmdk";
import { MapPin } from "lucide-react";

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
import { match } from "ts-pattern";
import React from "react";

export function Autocomplete<T extends { label: string }>(props: {
  renderItem: (x: T) => React.ReactElement;
  loadOptions: (query: string) => Promise<T[]>;
  onSelect: (value: T | undefined) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [value, setValue] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [options, setOptions] = React.useState<T[]>([]);

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
                setOptions(await props.loadOptions(input));
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
                            const currentItem = options.find(
                              (option) => option.label === currentValue
                            );
                            setValue(
                              currentValue === value ? "" : currentValue
                            );
                            setSearch(
                              currentValue === value
                                ? ""
                                : currentItem?.label ?? ""
                            );
                            props.onSelect(currentItem);
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
                          {props.renderItem(option)}
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
