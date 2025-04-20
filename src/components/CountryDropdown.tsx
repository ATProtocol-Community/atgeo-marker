"use client";
import React, {
  useCallback,
  useState,
  forwardRef,
  useEffect,
  useRef,
} from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

// shadcn
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";

// utils
import { cn } from "~/lib/utils";

// assets
import { ChevronDown, CheckIcon, Globe } from "lucide-react";
import { CircleFlag } from "react-circle-flags";

// data
import { countries } from "country-data-list";

// Country interface
export interface Country {
  alpha2: string;
  alpha3: string;
  countryCallingCodes: string[];
  currencies: string[];
  emoji?: string;
  ioc: string;
  languages: string[];
  name: string;
  status: string;
}

// Dropdown props
interface CountryDropdownProps {
  options?: Country[];
  onChange?: (country: Country) => void;
  defaultValue?: string;
  disabled?: boolean;
  placeholder?: string;
  slim?: boolean;
  className?: string;
}

const CountryDropdownComponent = (
  {
    options = countries.all
      .filter(
        (country: Country) =>
          country.emoji && country.status !== "deleted" && country.ioc !== "PRK"
      )
      .filter((x) => x.name),
    onChange,
    defaultValue,
    disabled = false,
    placeholder = "Select a country",
    slim = false,
    className = "",
    ...props
  }: CountryDropdownProps,
  ref: React.ForwardedRef<HTMLButtonElement>
) => {
  const [open, setOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | undefined>(
    undefined
  );
  // For some reason, the parentRef is not working when using the ref prop, so we need to use a state to store the ref
  const [parentRef, setParentRef] = useState<HTMLDivElement | null>(null);
  const [searchValue, setSearchValue] = useState("");

  const filteredOptions =
    searchValue === ""
      ? options
      : options.filter((option) =>
          option.name.toLowerCase().includes(searchValue.toLowerCase())
        );

  const virtualizer = useVirtualizer({
    count: filteredOptions.length,
    getScrollElement: () => parentRef,
    estimateSize: () => 32,
    initialRect: {
      height: 32 * 10,
      width: 100,
    },
  });

  useEffect(() => {
    if (selectedCountry) {
      return;
    }
    if (defaultValue) {
      const initialCountry = options.find(
        (country) => country.alpha3 === defaultValue
      );
      if (initialCountry) {
        setSelectedCountry(initialCountry);
      } else {
        // Reset selected country if defaultValue is not found
        setSelectedCountry(undefined);
      }
    } else {
      // Reset selected country if defaultValue is undefined or null
      setSelectedCountry(undefined);
    }
  }, [defaultValue, options]);

  const handleSelect = useCallback(
    (country: Country) => {
      setSelectedCountry(country);
      onChange?.(country);
      setOpen(false);
    },
    [onChange]
  );

  const triggerClasses = cn(
    "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
    slim === true && "w-20",
    className
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        ref={ref}
        className={triggerClasses}
        disabled={disabled}
        {...props}
      >
        {selectedCountry ? (
          <div className="flex items-center flex-grow w-0 gap-2 overflow-hidden">
            <div className="inline-flex items-center justify-center w-5 h-5 shrink-0 overflow-hidden rounded-full">
              <CircleFlag
                countryCode={selectedCountry.alpha2.toLowerCase()}
                height={20}
              />
            </div>
            {slim === false && (
              <span className="overflow-hidden text-ellipsis whitespace-nowrap text-foreground">
                {selectedCountry.name}
              </span>
            )}
          </div>
        ) : (
          <span>{slim === false ? placeholder : <Globe size={20} />}</span>
        )}
        <ChevronDown size={16} />
      </PopoverTrigger>
      <PopoverContent
        collisionPadding={10}
        side="bottom"
        className={"min-w-[--radix-popper-anchor-width] p-0"}
      >
        <Command
          shouldFilter={false}
          className="w-full max-h-[200px] sm:max-h-[270px]"
        >
          <CommandList
            ref={(el) => setParentRef(el)}
            style={{ height: 200, width: "100%", overflow: "auto" }}
          >
            <div className="sticky top-0 z-10 bg-popover">
              <CommandInput
                placeholder="Search country..."
                onValueChange={(value) => {
                  setSearchValue(value);
                }}
              />
            </div>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              <div
                style={{
                  height: virtualizer.getTotalSize() + "px",
                  width: "100%",
                  position: "relative",
                }}
              >
                {virtualizer.getVirtualItems().map((virtualRow) => (
                  <CommandItem
                    className="flex items-center w-full gap-2  absolute left-0 top-0 bg-transparent"
                    key={virtualRow.key}
                    onSelect={() =>
                      handleSelect(filteredOptions[virtualRow.index])
                    }
                    style={{
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <div className="flex flex-grow space-x-2 overflow-hidden w-0">
                      <div className="inline-flex items-center justify-center w-5 h-5 shrink-0 overflow-hidden rounded-full">
                        <CircleFlag
                          countryCode={filteredOptions[
                            virtualRow.index
                          ].alpha2.toLowerCase()}
                          height={20}
                        />
                      </div>
                      <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                        {filteredOptions[virtualRow.index].name}
                      </span>
                    </div>
                    <CheckIcon
                      className={cn(
                        "ml-auto h-4 w-4 shrink-0",
                        filteredOptions[virtualRow.index].name ===
                          selectedCountry?.name
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </div>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

CountryDropdownComponent.displayName = "CountryDropdownComponent";

export const CountryDropdown = forwardRef(CountryDropdownComponent);
